"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle, Search, FileDown, Eye, Edit, Send, Printer, Trash2, RefreshCw } from "lucide-react"
import type { Invoice } from "@/types"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date()

    // Handle different date formats
    const date = new Date(dateValue)

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date value:", dateValue)
      return new Date() // Return current date as fallback
    }

    return date
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch("https://sajfoods.net/busa-api/database/get_invoices.php")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()

      if (Array.isArray(data)) {
        // Direct array of invoices
        setInvoices(
          data.map((inv) => ({
            ...inv,
            issueDate: parseDate(inv.issueDate),
            dueDate: parseDate(inv.dueDate),
          })),
        )
      } else if (data.success && Array.isArray(data.data)) {
        // {success: true, data: [...]}
        setInvoices(
          data.data.map((inv) => ({
            ...inv,
            issueDate: parseDate(inv.issueDate),
            dueDate: parseDate(inv.dueDate),
          })),
        )
      } else {
        toast({
          title: "Error",
          description: `Failed to fetch invoices: ${data.message || "Unexpected data format."}`,
          variant: "destructive",
        })
        setInvoices([])
      }
    } catch (error: any) {
      toast({
        title: "Fetch Error",
        description: `Invoices: ${error.message}`,
        variant: "destructive",
      })
      setInvoices([])
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetchInvoices().finally(() => setIsLoading(false))
  }, [toast])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchInvoices()
    setIsRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Invoice list has been updated.",
    })
  }

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (invoice.customer.name && invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          invoice.status.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [invoices, searchTerm],
  )

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
  }

  const getStatusBadgeVariant = (status: Invoice["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Paid":
        return "default"
      case "Sent":
        return "secondary"
      case "Draft":
        return "outline"
      case "Overdue":
        return "destructive"
      case "Cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    const invoiceToDelete = invoices.find((inv) => inv.id === invoiceId)
    try {
      const response = await fetch("https://sajfoods.net/busa-api/database/delete_invoice.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoiceId }),
      })
      const result = await response.json()
      if (result.success) {
        setInvoices((prevInvoices) => prevInvoices.filter((inv) => inv.id !== invoiceId))
        toast({
          title: "Invoice Deleted",
          description: `Invoice "${invoiceToDelete?.invoiceNumber}" has been removed.`,
        })
      } else {
        throw new Error(result.message || "Failed to delete invoice from server.")
      }
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" })
    }
  }

  const handleExportInvoices = () => {
    // Convert invoices to CSV format
    const headers = ["Invoice #", "Customer", "Issue Date", "Due Date", "Status", "Amount"]
    const csvContent = [
      headers.join(","),
      ...filteredInvoices.map((invoice) =>
        [
          invoice.invoiceNumber,
          `"${invoice.customer.name}"`,
          format(invoice.issueDate, "yyyy-MM-dd"),
          format(invoice.dueDate, "yyyy-MM-dd"),
          invoice.status,
          invoice.totalAmount,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoices-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Invoices have been exported to CSV.",
    })
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank", "width=800,height=600")

    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow popups to print invoices.",
        variant: "destructive",
      })
      return
    }

    const printContent = generatePrintableInvoice(invoice)

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const generatePrintableInvoice = (invoice: Invoice): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
          }
          
          .company-info h1 {
            color: #2563eb;
            font-size: 28px;
            margin-bottom: 5px;
          }
          
          .company-info p {
            color: #666;
            margin: 2px 0;
          }
          
          .invoice-info {
            text-align: right;
          }
          
          .invoice-info h2 {
            font-size: 24px;
            color: #333;
            margin-bottom: 10px;
          }
          
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .bill-to, .invoice-meta {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
          }
          
          .bill-to h3, .invoice-meta h3 {
            margin-bottom: 15px;
            color: #333;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .items-table th,
          .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          
          .items-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          
          .items-table .text-right {
            text-align: right;
          }
          
          .totals {
            margin-left: auto;
            width: 300px;
          }
          
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          
          .totals-row.total {
            font-weight: bold;
            font-size: 18px;
            border-bottom: 2px solid #333;
            margin-top: 10px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .status-paid { background: #dcfce7; color: #166534; }
          .status-sent { background: #f1f5f9; color: #475569; }
          .status-draft { background: #f9fafb; color: #374151; border: 1px solid #d1d5db; }
          .status-overdue { background: #fef2f2; color: #dc2626; }
          .status-cancelled { background: #fef2f2; color: #dc2626; }
          
          .notes {
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          
          .notes h3 {
            margin-bottom: 10px;
            color: #333;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .header {
              page-break-inside: avoid;
            }
            
            .items-table {
              page-break-inside: auto;
            }
            
            .items-table tr {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>SAJ Foods</h1>
            <p>Your Company Address</p>
            <p>City, State, ZIP Code</p>
            <p>Phone: (123) 456-7890</p>
            <p>Email: info@sajfoods.net</p>
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span></p>
          </div>
        </div>
        
        <div class="invoice-details">
          <div class="bill-to">
            <h3>Bill To</h3>
            <p><strong>${invoice.customer.name}</strong></p>
            ${invoice.customer.email ? `<p>${invoice.customer.email}</p>` : ""}
            ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ""}
            ${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ""}
          </div>
          
          <div class="invoice-meta">
            <h3>Invoice Details</h3>
            <p><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</p>
            <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
            <p><strong>Payment Terms:</strong> Net 30</p>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoice.items
                ?.map(
                  (item) => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                <td class="text-right">${formatCurrency(item.total)}</td>
              </tr>
            `,
                )
                .join("") || '<tr><td colspan="4">No items found</td></tr>'
            }
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(invoice.subtotal || 0)}</span>
          </div>
          <div class="totals-row">
            <span>Tax:</span>
            <span>${formatCurrency(invoice.tax || 0)}</span>
          </div>
          <div class="totals-row total">
            <span>Total:</span>
            <span>${formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>
        
        ${
          invoice.notes
            ? `
          <div class="notes">
            <h3>Notes</h3>
            <p>${invoice.notes}</p>
          </div>
        `
            : ""
        }
        
        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `
  }

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "N/A"

    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      if (isNaN(dateObj.getTime())) return "Invalid Date"
      return format(dateObj, "PP")
    } catch (error) {
      console.warn("Date formatting error:", error)
      return "Invalid Date"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportInvoices}>
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/invoices/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </header>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>Track and manage all customer invoices.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoices..."
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customer.name}</TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <Link href={`/invoices/${invoice.id}`} passHref>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View Invoice
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/invoices/${invoice.id}/edit`} passHref>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" /> Send Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                            <Printer className="mr-2 h-4 w-4" /> Print Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Invoice
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete invoice "{invoice.invoiceNumber}". This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {searchTerm ? "No invoices match your search." : "No invoices found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredInvoices.length}</strong> of <strong>{invoices.length}</strong> invoices
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
