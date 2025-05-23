"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { ArrowLeft, Edit, Trash2, RefreshCw, Send } from "lucide-react"
import { PrintInvoice } from "@/components/print-invoice"
import { useToast } from "@/hooks/use-toast"
import type { Invoice } from "@/types"

export default function InvoiceDetailsPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`https://sajfoods.net/busa-api/database/get_invoice.php?id=${params.id}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.data) {
          // Process dates
          const invoiceData = {
            ...data.data,
            issueDate: new Date(data.data.issueDate),
            dueDate: new Date(data.data.dueDate),
          }
          setInvoice(invoiceData)
        } else if (Array.isArray(data) && data.length > 0) {
          // Handle direct array response
          const invoiceData = {
            ...data[0],
            issueDate: new Date(data[0].issueDate),
            dueDate: new Date(data[0].dueDate),
          }
          setInvoice(invoiceData)
        } else {
          toast({
            title: "Error",
            description: "Invoice not found or invalid response format",
            variant: "destructive",
          })
          router.push("/invoices")
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to fetch invoice: ${error.message}`,
          variant: "destructive",
        })
        router.push("/invoices")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoice()
  }, [params.id, router, toast])

  const handleDeleteInvoice = async () => {
    try {
      const response = await fetch("https://sajfoods.net/busa-api/database/delete_invoice.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Invoice Deleted",
          description: `Invoice "${invoice?.invoiceNumber}" has been removed.`,
        })
        router.push("/invoices")
      } else {
        throw new Error(result.message || "Failed to delete invoice from server.")
      }
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-semibold mb-2">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested invoice could not be found.</p>
        <Link href="/invoices">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
          <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
          <PrintInvoice invoice={invoice} size="sm" />
          <Link href={`/invoices/${params.id}/edit`}>
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete invoice "{invoice.invoiceNumber}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteInvoice}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold text-lg">{invoice.customer.name}</h3>
                {invoice.customer.email && <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>}
                {invoice.customer.phone && <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>}
              </div>
              {invoice.customer.address && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Billing Address</h4>
                  <p className="text-sm">{invoice.customer.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Invoice Number</dt>
                <dd className="text-sm">{invoice.invoiceNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Issue Date</dt>
                <dd className="text-sm">{formatDate(invoice.issueDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Due Date</dt>
                <dd className="text-sm">{formatDate(invoice.dueDate)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No items found for this invoice.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end">
          <div className="w-[300px] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Tax:</span>
              <span>{formatCurrency(invoice.tax || 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
