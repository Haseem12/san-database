"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
import { ArrowLeft, Save, Trash2, RefreshCw, Plus, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DatePicker } from "@/components/date-picker"
import type { Invoice, InvoiceItem, Customer } from "@/types"

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<{
    invoiceNumber: string
    customerId: string
    status: Invoice["status"]
    issueDate: Date
    dueDate: Date
    items: InvoiceItem[]
    notes: string
    subtotal: number
    tax: number
    totalAmount: number
  }>({
    invoiceNumber: "",
    customerId: "",
    status: "Draft",
    issueDate: new Date(),
    dueDate: new Date(),
    items: [],
    notes: "",
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
  })

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`https://sajfoods.net/busa-api/database/get_invoice.php?id=${params.id}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        let invoiceData: Invoice | null = null

        if (data.success && data.data) {
          // Process dates
          invoiceData = {
            ...data.data,
            issueDate: new Date(data.data.issueDate),
            dueDate: new Date(data.data.dueDate),
          }
        } else if (Array.isArray(data) && data.length > 0) {
          // Handle direct array response
          invoiceData = {
            ...data[0],
            issueDate: new Date(data[0].issueDate),
            dueDate: new Date(data[0].dueDate),
          }
        } else {
          toast({
            title: "Error",
            description: "Invoice not found or invalid response format",
            variant: "destructive",
          })
          router.push("/invoices")
          return
        }

        setInvoice(invoiceData)

        // Initialize form data
        setFormData({
          invoiceNumber: invoiceData.invoiceNumber,
          customerId: invoiceData.customer.id,
          status: invoiceData.status,
          issueDate: new Date(invoiceData.issueDate),
          dueDate: new Date(invoiceData.dueDate),
          items: invoiceData.items || [],
          notes: invoiceData.notes || "",
          subtotal: invoiceData.subtotal || 0,
          tax: invoiceData.tax || 0,
          totalAmount: invoiceData.totalAmount,
        })

        // Fetch customers for dropdown
        fetchCustomers()
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

    const fetchCustomers = async () => {
      try {
        const response = await fetch("https://sajfoods.net/busa-api/database/get_customers.php")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (Array.isArray(data)) {
          setCustomers(data)
        } else if (data.success && Array.isArray(data.data)) {
          setCustomers(data.data)
        } else {
          console.warn("Unexpected customer data format:", data)
          setCustomers([])
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error)
        setCustomers([])
      }
    }

    fetchInvoice()
  }, [params.id, router, toast])

  const calculateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const tax = subtotal * 0.075 // 7.5% tax rate
    const totalAmount = subtotal + tax

    return {
      subtotal,
      tax,
      totalAmount,
    }
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...formData.items]

    if (field === "quantity" || field === "unitPrice") {
      const numValue = Number.parseFloat(value) || 0
      updatedItems[index][field] = numValue

      // Recalculate total for this item
      const item = updatedItems[index]
      item.total = item.quantity * item.unitPrice
    } else {
      updatedItems[index][field] = value
    }

    // Recalculate invoice totals
    const { subtotal, tax, totalAmount } = calculateTotals(updatedItems)

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      tax,
      totalAmount,
    })
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `temp-${Date.now()}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }

    const updatedItems = [...formData.items, newItem]

    // Recalculate invoice totals
    const { subtotal, tax, totalAmount } = calculateTotals(updatedItems)

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      tax,
      totalAmount,
    })
  }

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index)

    // Recalculate invoice totals
    const { subtotal, tax, totalAmount } = calculateTotals(updatedItems)

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      tax,
      totalAmount,
    })
  }

  const handleSaveInvoice = async () => {
    try {
      setIsSaving(true)

      // Find the selected customer
      const selectedCustomer = customers.find((c) => c.id === formData.customerId)

      if (!selectedCustomer) {
        toast({
          title: "Error",
          description: "Please select a valid customer",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const updatedInvoice = {
        id: params.id,
        invoiceNumber: formData.invoiceNumber,
        customer: selectedCustomer,
        status: formData.status,
        issueDate: format(formData.issueDate, "yyyy-MM-dd"),
        dueDate: format(formData.dueDate, "yyyy-MM-dd"),
        items: formData.items,
        subtotal: formData.subtotal,
        tax: formData.tax,
        totalAmount: formData.totalAmount,
        notes: formData.notes,
      }

      const response = await fetch("https://sajfoods.net/busa-api/database/update_invoice.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedInvoice),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Invoice Updated",
          description: `Invoice "${formData.invoiceNumber}" has been updated.`,
        })
        router.push(`/invoices/${params.id}`)
      } else {
        throw new Error(result.message || "Failed to update invoice.")
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

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
          <Link href={`/invoices/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={handleSaveInvoice} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
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
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Invoice["status"] })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <DatePicker
                  date={formData.issueDate}
                  setDate={(date) => setFormData({ ...formData, issueDate: date || new Date() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <DatePicker
                  date={formData.dueDate}
                  setDate={(date) => setFormData({ ...formData, dueDate: date || new Date() })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  disabled={customers.length === 0}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder={customers.length === 0 ? "No customers available" : "Select customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length > 0 ? (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No customers available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {customers.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No customers found. Please add customers first before creating invoices.
                </div>
              )}

              {/* Display selected customer details */}
              {formData.customerId && (
                <div className="p-4 bg-muted rounded-md">
                  {(() => {
                    const selectedCustomer = customers.find((c) => c.id === formData.customerId)
                    if (!selectedCustomer) return null

                    return (
                      <>
                        <h3 className="font-medium">{selectedCustomer.name}</h3>
                        {selectedCustomer.email && <p className="text-sm">{selectedCustomer.email}</p>}
                        {selectedCustomer.phone && <p className="text-sm">{selectedCustomer.phone}</p>}
                        {selectedCustomer.address && <p className="text-sm mt-2">{selectedCustomer.address}</p>}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoice Items</CardTitle>
          <Button size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items added to this invoice yet.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              formData.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <Label htmlFor={`item-${index}-description`} className="sr-only">
                      Description
                    </Label>
                    <Input
                      id={`item-${index}-description`}
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`item-${index}-quantity`} className="sr-only">
                      Quantity
                    </Label>
                    <Input
                      id={`item-${index}-quantity`}
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`item-${index}-price`} className="sr-only">
                      Unit Price
                    </Label>
                    <Input
                      id={`item-${index}-price`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium">{formatCurrency(item.total)}</div>
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Minus className="h-4 w-4" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <div className="w-[300px] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Subtotal:</span>
              <span>{formatCurrency(formData.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Tax (7.5%):</span>
              <span>{formatCurrency(formData.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{formatCurrency(formData.totalAmount)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes or payment terms for this invoice"
            className="min-h-[100px]"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="default" onClick={handleSaveInvoice} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
