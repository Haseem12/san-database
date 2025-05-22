"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CalendarIcon, PlusCircle, Trash2, AlertCircle } from "lucide-react"
import type { Sale } from "@/types"

export default function EditSalePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const saleId = params.id as string

  // State for sale data
  const [sale, setSale] = useState<Sale | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [activeTab, setActiveTab] = useState("customer-products")
  const [saleDate, setSaleDate] = useState<Date | null>(null)
  const [items, setItems] = useState<any[]>([
    { productId: "", productName: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
  ])
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [notes, setNotes] = useState("")
  const [discountAmount, setDiscountAmount] = useState(0)
  const [subTotal, setSubTotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [status, setStatus] = useState("Completed")

  // Products and customers data
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  // For client-side rendering
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Fetch sale data
  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`https://sajfoods.net/busa-api/database/get_sale.php?id=${saleId}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          const saleData = data.data
          setSale(saleData)

          // Initialize form state with sale data
          setSaleDate(new Date(saleData.saleDate))
          setItems(
            saleData.items.length > 0
              ? saleData.items
              : [{ productId: "", productName: "", quantity: 1, unitPrice: 0, totalPrice: 0 }],
          )
          setPaymentMethod(saleData.paymentMethod)
          setNotes(saleData.notes || "")
          setDiscountAmount(saleData.discountAmount || 0)
          setSubTotal(saleData.subTotal)
          setTaxAmount(saleData.taxAmount || 0)
          setTotalAmount(saleData.totalAmount)
          setStatus(saleData.status)
          setSelectedCustomer(saleData.customer)
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

    // Fetch products
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true)
        const response = await fetch("https://sajfoods.net/busa-api/database/get_products.php")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setFetchedProducts(data.data)
        } else {
          toast({
            title: "Warning",
            description: data.message || "Failed to load products",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Error fetching products:", error)
        toast({
          title: "Warning",
          description: `Failed to load products: ${error.message}`,
        })
      } finally {
        setIsLoadingProducts(false)
      }
    }

    if (saleId) {
      fetchSaleDetails()
      fetchProducts()
    }
  }, [saleId, toast])

  // Calculate totals when items or discount change
  useEffect(() => {
    const calculatedSubTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    setSubTotal(calculatedSubTotal)

    // Assuming tax rate is 7.5%
    const TAX_RATE = 0.075
    const calculatedTaxAmount = (calculatedSubTotal - (discountAmount || 0)) * TAX_RATE
    setTaxAmount(calculatedTaxAmount)

    const calculatedTotalAmount = calculatedSubTotal - (discountAmount || 0) + calculatedTaxAmount
    setTotalAmount(calculatedTotalAmount)
  }, [items, discountAmount])

  // Handle item changes
  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // If product ID changed, update product name and unit price
    if (field === "productId") {
      const selectedProduct = fetchedProducts.find((p) => p.id === value)
      if (selectedProduct) {
        updatedItems[index].productName = selectedProduct.name
        updatedItems[index].unitPrice = selectedProduct.price || 0
        updatedItems[index].unitOfMeasure = selectedProduct.unitOfMeasure || "PCS"

        // Apply price level if customer has one
        if (selectedCustomer?.priceLevel && selectedProduct.priceLevels) {
          const priceLevel = selectedProduct.priceLevels[selectedCustomer.priceLevel]
          if (priceLevel) {
            updatedItems[index].unitPrice = priceLevel
            updatedItems[index].appliedPriceLevel = selectedCustomer.priceLevel
          } else {
            updatedItems[index].appliedPriceLevel = "Standard Price (Fallback)"
          }
        } else {
          updatedItems[index].appliedPriceLevel = "Standard Price"
        }
      }
    }

    // If quantity or unit price changed, update total price
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? Number.parseFloat(value) : updatedItems[index].quantity
      const unitPrice = field === "unitPrice" ? Number.parseFloat(value) : updatedItems[index].unitPrice
      updatedItems[index].totalPrice = quantity * unitPrice
    }

    setItems(updatedItems)
  }

  // Add new item
  const addItem = () => {
    setItems([...items, { productId: "", productName: "", quantity: 1, unitPrice: 0, totalPrice: 0 }])
  }

  // Remove item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = [...items]
      updatedItems.splice(index, 1)
      setItems(updatedItems)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!saleDate || !selectedCustomer || items.some((item) => !item.productId || !item.quantity)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare sale data for update
      const saleData = {
        id: saleId,
        saleDate: format(saleDate, "yyyy-MM-dd HH:mm:ss"),
        customer: selectedCustomer,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email || null,
        customerAddress: selectedCustomer.address || null,
        customerPriceLevel: selectedCustomer.priceLevel || null,
        items: items.filter((item) => item.productId && item.quantity > 0),
        subTotal,
        discountAmount: discountAmount > 0 ? discountAmount : null,
        taxAmount,
        totalAmount,
        paymentMethod,
        status,
        notes: notes || null,
        updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        invoiceId: sale?.invoiceId,
      }

      const response = await fetch("https://sajfoods.net/busa-api/database/update_sale.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText || response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sale Updated",
          description: `Sale ID "${result.saleId}" has been updated successfully.`,
        })
        router.push(`/sales/${result.saleId}`)
      } else {
        toast({
          title: "Update Failed",
          description: result.message || "Failed to update sale.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error updating sale:", error)
      toast({
        title: "Operation Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
        <Link href={`/sales/${saleId}`} passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sale Details
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <form id="edit-sale-form" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Edit Sale #{saleId}</CardTitle>
              <CardDescription>Update the details for this sale.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="customer-products">Customer & Products</TabsTrigger>
                <TabsTrigger value="payment-summary">Payment & Summary</TabsTrigger>
              </TabsList>
              <TabsContent value="customer-products" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="customer">Customer</Label>
                    <Input id="customer" value={selectedCustomer?.name || ""} disabled className="bg-muted/50" />
                    {selectedCustomer && (
                      <div className="mt-2 text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                        <div className="font-medium">Customer Details</div>
                        {selectedCustomer.priceLevel && (
                          <div>
                            Price Level:{" "}
                            <Badge variant="secondary" className="ml-1">
                              {selectedCustomer.priceLevel}
                            </Badge>
                          </div>
                        )}
                        {selectedCustomer.zone && (
                          <div>
                            Zone:{" "}
                            <Badge variant="outline" className="ml-1">
                              {selectedCustomer.zone}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="saleDate">Sale Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !saleDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {hasMounted && saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={saleDate}
                          onSelect={setSaleDate}
                          initialFocus
                          disabled={!hasMounted}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Sale Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Applied Price Level</TableHead>
                          <TableHead className="text-right">Unit Price (NGN)</TableHead>
                          <TableHead className="text-right">Total (NGN)</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                value={item.productId || ""}
                                onValueChange={(value) => handleItemChange(index, "productId", value)}
                                disabled={isLoadingProducts}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={isLoadingProducts ? "Loading Products..." : "Select product"}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {fetchedProducts
                                    ?.filter((p) => p.id && String(p.id).trim() !== "")
                                    .map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.name} ({p.unitOfMeasure}
                                        {p.litres ? ` - ${p.litres}L` : ""}) - Stock: {p.stock ?? "N/A"}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity || ""}
                                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                min="1"
                                disabled={!item.productId}
                              />
                            </TableCell>
                            <TableCell>{item.unitOfMeasure || "N/A"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.appliedPriceLevel === "Standard Price" ||
                                  item.appliedPriceLevel === "Standard Price (Fallback)"
                                    ? "outline"
                                    : "default"
                                }
                              >
                                {item.appliedPriceLevel || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.totalPrice || 0)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                                disabled={items.length === 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="mt-4"
                      disabled={isLoadingProducts}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="payment-summary" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment & Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select onValueChange={(value: string) => setPaymentMethod(value)} value={paymentMethod}>
                          <SelectTrigger id="paymentMethod">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Online">Online Payment</SelectItem>
                            <SelectItem value="Credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select onValueChange={(value: string) => setStatus(value)} value={status}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Instructions or notes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Sale Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Subtotal:</Label>
                        <span>{formatCurrency(subTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Label htmlFor="discountAmount">Discount (NGN):</Label>
                        <Input
                          id="discountAmount"
                          type="number"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Number.parseFloat(e.target.value) || 0)}
                          className="w-32 text-right"
                          placeholder="0.00"
                          min="0"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Label>Tax (7.5%):</Label>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <Label>Total Amount:</Label>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2 mt-4">
              <Link href={`/sales/${saleId}`} passHref>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={
                  !hasMounted ||
                  isSubmitting ||
                  isLoadingProducts ||
                  !selectedCustomer ||
                  items.some((item) => !item.productId || !item.quantity || item.quantity <= 0)
                }
              >
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Tabs>
    </div>
  )
}
