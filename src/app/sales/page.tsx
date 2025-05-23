import type React from "react"
import { useState, useEffect } from "react"
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
import type { Sale } from "@/types"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalSales, setTotalSales] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async (search = "") => {
    setIsLoading(true)
    setError(null)

    try {
      const url = `https://sajfoods.net/busa-api/database/get_sales.php${search ? `?search=${encodeURIComponent(search)}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSales(data.data)
        setTotalSales(data.pagination.total)
      } else {
        throw new Error(data.message || "Failed to fetch sales data")
      }
    } catch (err) {
      console.error("Error fetching sales:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast({
        title: "Error",
        description: "Failed to load sales data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    fetchSales(searchTerm)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
  }

  const getStatusBadgeVariant = (status: Sale["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Completed":
        return "default"
      case "Pending":
        return "secondary"
      case "Cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleViewDetails = (sale: Sale) => {
    // TO DO: implement view details logic
  }

  const handleEditSale = (sale: Sale) => {
    // TO DO: implement edit sale logic
  }

  const handleCancelSale = (sale: Sale) => {
    // TO DO: implement cancel sale logic
  }

  const handlePrintSale = (sale: Sale) => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank", "width=800,height=600")

    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow popups to print sales.",
        variant: "destructive",
      })
      return
    }

    const printContent = generatePrintableSale(sale)

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const generatePrintableSale = (sale: Sale): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sale ${sale.id}</title>
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
          
          .sale-info {
            text-align: right;
          }
          
          .sale-info h2 {
            font-size: 24px;
            color: #333;
            margin-bottom: 10px;
          }
          
          .sale-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .bill-to, .sale-meta {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
          }
          
          .bill-to h3, .sale-meta h3 {
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
            <p>Address</p>
            <p>Phone: (123) 456-7890</p>
            <p>Email: info@sajfoods.net</p>
          </div>
          <div class="sale-info">
            <h2>SALE</h2>
            <p><strong>Sale ID:</strong> ${sale.id}</p>
            <p><strong>Customer:</strong> ${sale.customer.name}</p>
          </div>
        </div>
        
        <div class="sale-details">
          <div class="bill-to">
            <h3>Bill To</h3>
            <p><strong>${sale.customer.name}</strong></p>
            ${sale.customer.email ? `<p>${sale.customer.email}</p>` : ""}
            ${sale.customer.address ? `<p>${sale.customer.address}</p>` : ""}
            ${sale.customer.phone ? `<p>${sale.customer.phone}</p>` : ""}
          </div>
          
          <div class="sale-meta">
            <h3>Sale Details</h3>
            <p><strong>Issue Date:</strong> ${formatDate(sale.saleDate)}</p>
            <p><strong>Due Date:</strong> ${formatDate(sale.saleDate)}</p>
            <p><strong>Payment Terms:</strong> Net 30</p>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              sale.items
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
            <span>${formatCurrency(sale.subtotal || 0)}</span>
          </div>
          <div class="totals-row">
            <span>Tax:</span>
            <span>${formatCurrency(sale.tax || 0)}</span>
          </div>
          <div class="totals-row total">
            <span>Total:</span>
            <span>${formatCurrency(sale.totalAmount)}</span>
          </div>
        </div>
        
        ${
          sale.notes
            ? `
          <div class="notes">
            <h3>Notes</h3>
            <p>${sale.notes}</p>
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
          <p>Loading sales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportSales}>
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/sales/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </Link>
        </div>
      </header>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Transaction Management</CardTitle>
          <CardDescription>Track and manage all customer sales.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sales..."
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <p>Loading sales...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-8 text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              <p>{error}</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sales found. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>{sale.customer.name}</TableCell>
                    <TableCell>{formatDate(sale.saleDate)}</TableCell>
                    <TableCell>{formatDate(sale.saleDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sale.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
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
                          <Link href={`/sales/${sale.id}`} passHref>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/sales/${sale.id}/edit`} passHref>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Sale
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleCancelSale(sale)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Cancel Sale
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePrintSale(sale)}>
                            <FileDown className="mr-2 h-4 w-4" /> Print Sale
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{sales.length}</strong> of <strong>{totalSales}</strong> sales
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


