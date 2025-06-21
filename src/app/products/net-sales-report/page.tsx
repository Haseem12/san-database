"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, RefreshCw, BarChart3, CalendarDays, AlertCircle, CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format, startOfDay, endOfDay, isValid, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

// Types
interface SaleItem {
  productName: string
  quantity: number
  price?: number
}

interface Sale {
  id: string
  saleDate: Date | null
  items: SaleItem[]
  customerName?: string
  totalAmount?: number
}

interface CreditNoteSaleItem {
  productName: string
  quantity: number
  price?: number
}

interface CreditNote {
  id: string
  creditNoteDate: Date | null
  reason: string
  items: CreditNoteSaleItem[]
  customerName?: string
  totalAmount?: number
}

interface ProductData {
  productName: string
  description: string
  netQuantity: number
}

// Date Picker Component
interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  placeholder?: string
}

function DatePickerComponent({ date, setDate, placeholder = "Pick a date" }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  )
}

// API Functions
async function fetchSalesWithProducts() {
  const BASE = "https://sajfoods.net/busa-api/database/"
  const PRIMARY = BASE + "get_sales_with_items.php"
  const FALLBACK = BASE + "get_sales.php"

  async function fetchJson(url: string) {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "NetSales/1.0",
        Accept: "application/json",
      },
    })
    return { ok: res.ok, status: res.status, data: await res.json() }
  }

  try {
    let { ok, status, data } = await fetchJson(PRIMARY)

    if (!ok) {
      console.warn(`Primary endpoint returned ${status}. Falling back…`)
      ;({ ok, status, data } = await fetchJson(FALLBACK))
    }

    if (!ok) throw new Error(`Both endpoints failed – status: ${status}`)

    if (!data.success || !Array.isArray(data.data)) {
      throw new Error("Unexpected API shape from upstream")
    }

    const processedSales = data.data.map((sale: any) => {
      const hasItems = Array.isArray(sale.items) && sale.items.length
      const items = hasItems
        ? sale.items.map((it: any, i: number) => ({
            id: it.id ?? i,
            saleId: sale.id,
            productId: it.productId ?? it.product_id ?? 0,
            productName: it.productName ?? it.product_name ?? `Product ${it.productId ?? i}`,
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.unitPrice ?? it.unit_price ?? it.price) || 0,
          }))
        : [
            {
              id: 1,
              saleId: sale.id,
              productId: 0,
              productName: `Sale to ${sale.customer?.name ?? "Customer " + sale.id}`,
              quantity: 1,
              unitPrice: Number(sale.totalAmount) || 0,
            },
          ]

      return {
        id: sale.id,
        saleDate: sale.saleDate,
        customer: sale.customer ?? {},
        status: sale.status,
        totalAmount: Number(sale.totalAmount) || 0,
        paymentMethod: sale.paymentMethod,
        items: items,
      }
    })

    return {
      success: true,
      data: processedSales,
    }
  } catch (err: any) {
    console.error("Sales API Error:", err)
    return { success: false, message: err.message }
  }
}

async function fetchCreditNotes() {
  try {
    const response = await fetch("https://sajfoods.net/busa-api/database/get_credit_notes.php", {
      cache: "no-store",
      headers: {
        "User-Agent": "NetSales/1.0",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Credit Notes API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error("Credit Notes API Error:", error)
    return { success: false, message: error.message }
  }
}

// Main Component
export default function NetSalesReportPage() {
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [allCreditNotes, setAllCreditNotes] = useState<CreditNote[]>([])

  const [isLoadingSales, setIsLoadingSales] = useState(true)
  const [isLoadingCreditNotes, setIsLoadingCreditNotes] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
  const [toDate, setToDate] = useState<Date | undefined>(undefined)
  const { toast } = useToast()

  const parseApiDateString = useCallback((dateInput: string | Date | undefined | null): Date | null => {
    if (!dateInput) return null
    if (dateInput instanceof Date) return isValid(dateInput) ? dateInput : null

    const dateString = String(dateInput).trim()
    if (dateString === "0000-00-00 00:00:00" || dateString === "0000-00-00") return null

    let parsed = parseISO(dateString.replace(" ", "T"))
    if (isValid(parsed)) return parsed

    parsed = parseISO(dateString)
    if (isValid(parsed)) return parsed

    parsed = new Date(dateString)
    return isValid(parsed) ? parsed : null
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoadingSales(true)
    setIsLoadingCreditNotes(true)
    setFetchError(null)
    setIsRefreshing(true)

    try {
      // Fetch sales
      const salesResult = await fetchSalesWithProducts()

      if (salesResult.success && Array.isArray(salesResult.data)) {
        const parsedSales = salesResult.data.map((s_raw: any) => {
          const saleDate = parseApiDateString(s_raw.saleDate)

          const items = Array.isArray(s_raw.items)
            ? s_raw.items.map((item: any) => ({
                productName: item.productName || `Product ${item.productId}`,
                quantity: Number(item.quantity) || 0,
                price: Number(item.unitPrice) || 0,
              }))
            : []

          return {
            id: String(s_raw.id),
            saleDate,
            items,
            customerName: s_raw.customerName,
          } as Sale
        })

        setAllSales(parsedSales)
        setIsLoadingSales(false)
      }

      // Fetch credit notes
      const creditNotesResult = await fetchCreditNotes()

      if (creditNotesResult.success && Array.isArray(creditNotesResult.data)) {
        const parsedCreditNotes = creditNotesResult.data.map((cn_raw: any) => {
          const creditNoteDate = parseApiDateString(cn_raw.creditNoteDate)

          let items: CreditNoteSaleItem[] = []
          if (cn_raw.reason === "Returned Goods") {
            if (Array.isArray(cn_raw.items) && cn_raw.items.length > 0) {
              items = cn_raw.items.map((item: any) => ({
                productName: item.productName || "Returned Product",
                quantity: Number(item.quantity) || 1,
                price: Number(item.price) || 0,
              }))
            } else {
              items = [
                {
                  productName: `Returned Goods - ${cn_raw.ledgerAccountName}`,
                  quantity: 1,
                  price: Number(cn_raw.amount) || 0,
                },
              ]
            }
          }

          return {
            id: String(cn_raw.id),
            creditNoteDate,
            items,
            reason: cn_raw.reason,
          } as CreditNote
        })

        setAllCreditNotes(parsedCreditNotes)
        setIsLoadingCreditNotes(false)
      }

      toast({
        title: "Data Loaded",
        description: `Loaded ${salesResult.data?.length || 0} sales and ${creditNotesResult.data?.length || 0} credit notes`,
      })
    } catch (error: any) {
      console.error("Fetch error:", error)
      setFetchError(error.message)
      setIsLoadingSales(false)
      setIsLoadingCreditNotes(false)
      toast({
        title: "Error Loading Data",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [toast, parseApiDateString])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isOverallLoading = isLoadingSales || isLoadingCreditNotes

  // Calculate net quantities by product
  const productData: ProductData[] = useMemo(() => {
    if (allSales.length === 0 && allCreditNotes.length === 0) {
      return []
    }

    const productMap = new Map<string, { quantity: number; transactions: number }>()

    // Add sales quantities
    allSales.forEach((sale) => {
      const saleDate = sale.saleDate
      if (!saleDate || !isValid(saleDate)) return

      const isAfterFromDate = !fromDate || saleDate >= startOfDay(fromDate)
      const isBeforeToDate = !toDate || saleDate <= endOfDay(toDate)

      if (isAfterFromDate && isBeforeToDate && Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          if (item.productName && item.productName.trim() !== "") {
            const existing = productMap.get(item.productName) || { quantity: 0, transactions: 0 }
            existing.quantity += Number(item.quantity) || 0
            existing.transactions += 1
            productMap.set(item.productName, existing)
          }
        })
      }
    })

    // Subtract credit note quantities
    allCreditNotes.forEach((cn) => {
      if (cn.reason !== "Returned Goods" || !Array.isArray(cn.items)) return

      const cnDate = cn.creditNoteDate
      if (!cnDate || !isValid(cnDate)) return

      const isAfterFromDate = !fromDate || cnDate >= startOfDay(fromDate)
      const isBeforeToDate = !toDate || cnDate <= endOfDay(toDate)

      if (isAfterFromDate && isBeforeToDate) {
        cn.items.forEach((item) => {
          if (item.productName && item.productName.trim() !== "") {
            const existing = productMap.get(item.productName) || { quantity: 0, transactions: 0 }
            existing.quantity -= Number(item.quantity) || 0
            productMap.set(item.productName, existing)
          }
        })
      }
    })

    // Convert to array with descriptions
    let result = Array.from(productMap.entries()).map(([productName, data]) => ({
      productName,
      description: `${data.transactions} transaction${data.transactions !== 1 ? "s" : ""}`,
      netQuantity: data.quantity,
    }))

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Sort by net quantity (highest first)
    result.sort((a, b) => b.netQuantity - a.netQuantity)

    return result
  }, [allSales, allCreditNotes, fromDate, toDate, searchTerm])

  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchData()
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const totalNetQuantity = useMemo(() => productData.reduce((sum, p) => sum + p.netQuantity, 0), [productData])

  const clearDateFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
  }

  if (isOverallLoading && allSales.length === 0 && allCreditNotes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading product data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between pb-4 border-b">
        <h1 className="text-3xl font-bold flex items-center">
          <BarChart3 className="mr-3 h-8 w-8" /> Net Product Quantities
        </h1>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error: {fetchError}</AlertDescription>
        </Alert>
      )}

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">From Date</label>
              <DatePickerComponent date={fromDate} setDate={setFromDate} placeholder="Start date" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">To Date</label>
              <DatePickerComponent date={toDate} setDate={setToDate} placeholder="End date" />
            </div>
          </div>
          {(fromDate || toDate) && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearDateFilters}>
                Clear Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                {fromDate && `From: ${format(fromDate, "MMM dd, yyyy")}`}
                {fromDate && toDate && " • "}
                {toDate && `To: ${format(toDate, "MMM dd, yyyy")}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Net Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isOverallLoading ? (
                <RefreshCw className="h-6 w-6 animate-spin inline" />
              ) : (
                totalNetQuantity.toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isOverallLoading ? (
                <RefreshCw className="h-6 w-6 animate-spin inline" />
              ) : (
                productData.length.toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Net Quantities</CardTitle>
          <CardDescription>Net quantity sold (Sales - Returns) for each product</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10 max-w-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Net Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isRefreshing ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin inline mr-2" />
                      Refreshing...
                    </TableCell>
                  </TableRow>
                ) : isOverallLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin inline mr-2" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : productData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  productData.map((product) => (
                    <TableRow key={product.productName}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{product.description}</TableCell>
                      <TableCell className="text-right font-semibold">{product.netQuantity.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Showing <strong>{productData.length}</strong> products
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
