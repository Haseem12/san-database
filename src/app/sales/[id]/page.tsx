"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Printer, FileText, User, Tag, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { Sale } from "@/types"

export default function SaleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const saleId = params.id as string

  const [sale, setSale] = useState<Sale | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`https://sajfoods.net/busa-api/database/get_sale_details.php?id=${saleId}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setSale(data.data)
        } else {
          setError(data.message || "Failed to fetch sale details")
        }
      } catch (error: any) {
        console.error("Error fetching sale details:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: `Failed to load sale details: ${error.message}`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (saleId) {
      fetchSaleDetails()
    }
  }, [saleId, toast])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading sale details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive text-lg font-semibold mb-4">Error: {error}</p>
        <Link href="/sales" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Sales
          </Button>
        </Link>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="mb-4">Sale not found.</p>
        <Link href="/sales" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Sales
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/sales" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/sales/${sale.id}/edit`} passHref>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" /> Edit Sale
            </Button>
          </Link>
          {sale.invoice?.id && (
            <Link href={`/invoices/${sale.invoice.id}`} passHref>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" /> View Invoice
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Sale #{sale.id}</CardTitle>
              <CardDescription>Created on {format(new Date(sale.createdAt), "PPP")}</CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(sale.status)} className="text-sm">
              {sale.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <User className="mr-2 h-4 w-4" /> Customer Information
              </h3>
              <div className="space-y-1">
                <p className="font-medium">{sale.customer.name}</p>
                {sale.customer.email && <p className="text-sm text-muted-foreground">{sale.customer.email}</p>}
                {sale.customer.address && <p className="text-sm text-muted-foreground">{sale.customer.address}</p>}
                {sale.customer.priceLevel && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Price Level:</span>{" "}
                    <Badge variant="outline">{sale.customer.priceLevel}</Badge>
                  </p>
                )}
                {sale.customer.zone && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Zone:</span>{" "}
                    <Badge variant="secondary">{sale.customer.zone}</Badge>
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Tag className="mr-2 h-4 w-4" /> Sale Details
              </h3>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Sale Date:</span>{" "}
                  <span className="font-medium">{format(new Date(sale.saleDate), "PPP")}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Payment Method:</span>{" "}
                  <span className="font-medium">{sale.paymentMethod}</span>
                </p>
                {sale.invoice?.id && (
                  <>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Invoice Number:</span>{" "}
                      <span className="font-medium">{sale.invoice.invoiceNumber}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Invoice Status:</span>{" "}
                      <Badge variant={sale.invoice.status === "Paid" ? "default" : "secondary"}>
                        {sale.invoice.status}
                      </Badge>
                    </p>
                    {sale.invoice.dueDate && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Due Date:</span>{" "}
                        <span className="font-medium">{format(new Date(sale.invoice.dueDate), "PPP")}</span>
                      </p>
                    )}
                  </>
                )}
                <p className="text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>{" "}
                  <span className="font-medium">{format(new Date(sale.updatedAt), "PPP p")}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sale Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Unit</TableHead>
                <TableHead className="text-center">Price Level</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>
                    <div className="font-medium">{item.productName}</div>
                    {item.productDescription && (
                      <div className="text-xs text-muted-foreground">{item.productDescription}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">{item.unitOfMeasure || "PCS"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {item.appliedPriceLevel || "Standard Price"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(sale.subTotal)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-destructive">-{formatCurrency(sale.discountAmount)}</span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>{formatCurrency(sale.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>
          </div>

          {sale.notes && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-1 flex items-center">
                <Clock className="mr-2 h-4 w-4" /> Notes:
              </h4>
              <p className="text-sm text-muted-foreground">{sale.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
