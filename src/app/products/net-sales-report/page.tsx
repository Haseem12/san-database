"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, RefreshCw, Package, ChevronDown, ChevronRight, Eye, Calendar, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Types
interface SaleDetail {
  saleId: string
  saleDate: string
  customerName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface ProductData {
  productName: string
  netQuantity: number
  totalSales: number
  salesCount: number
  sales: SaleDetail[]
}

// API Function
async function fetchSalesWithProducts() {
  const BASE = "https://sajfoods.net/busa-api/database/"
  const PRIMARY = BASE + "get_sales_with_items.php"
  const FALLBACK = BASE + "get_sales.php"

  async function fetchJson(url: string) {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "ProductReport/1.0",
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
      throw new Error("Unexpected API response")
    }

    return {
      success: true,
      data: data.data,
    }
  } catch (err: any) {
    console.error("API Error:", err)
    return { success: false, message: err.message }
  }
}

// Product Row Component with Details
function ProductRow({ product }: { product: ProductData }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <TableRow className="cursor-pointer hover:bg-muted/50">
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {product.productName}
            </div>
          </TableCell>
          <TableCell className="text-right font-semibold">{product.netQuantity.toLocaleString()}</TableCell>
          <TableCell className="text-right">₦{product.totalSales.toLocaleString()}</TableCell>
          <TableCell className="text-center">
            <Badge variant="secondary">{product.salesCount} sales</Badge>
          </TableCell>
          <TableCell className="text-center">
            <Eye className="h-4 w-4 text-muted-foreground" />
          </TableCell>
        </TableRow>
      </CollapsibleTrigger>
      <CollapsibleContent asChild>
        <TableRow>
          <TableCell colSpan={5} className="p-0">
            <div className="bg-muted/30 p-4 border-t">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Sales Details for {product.productName}
              </h4>
              <div className="grid gap-2">
                {product.sales.map((sale, index) => (
                  <div
                    key={`${sale.saleId}-${index}`}
                    className="flex items-center justify-between p-3 bg-background rounded-md border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{new Date(sale.saleDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{sale.customerName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        Qty: <strong>{sale.quantity}</strong>
                      </span>
                      <span>
                        Price: <strong>₦{sale.unitPrice.toLocaleString()}</strong>
                      </span>
                      <span>
                        Total: <strong>₦{sale.totalPrice.toLocaleString()}</strong>
                      </span>
                      <Badge variant="outline">Sale #{sale.saleId}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Main Component
export default function ProductDetailsPage() {
  const [productData, setProductData] = useState<ProductData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setIsRefreshing(true)
    setFetchError(null)

    try {
      const result = await fetchSalesWithProducts()

      if (result.success && Array.isArray(result.data)) {
        // Aggregate products with detailed sales information
        const productMap = new Map<string, ProductData>()

        result.data.forEach((sale: any) => {
          if (Array.isArray(sale.items)) {
            sale.items.forEach((item: any) => {
              const productName = item.productName || `Product ${item.productId || "Unknown"}`
              const quantity = Number(item.quantity) || 0
              const unitPrice = Number(item.unitPrice) || 0
              const totalPrice = quantity * unitPrice

              if (!productMap.has(productName)) {
                productMap.set(productName, {
                  productName,
                  netQuantity: 0,
                  totalSales: 0,
                  salesCount: 0,
                  sales: [],
                })
              }

              const product = productMap.get(productName)!
              product.netQuantity += quantity
              product.totalSales += totalPrice
              product.salesCount += 1

              // Add sale detail
              product.sales.push({
                saleId: sale.id || "Unknown",
                saleDate: sale.saleDate || new Date().toISOString(),
                customerName: sale.customerName || `Customer ${sale.id}`,
                quantity,
                unitPrice,
                totalPrice,
              })
            })
          }
        })

        // Convert to array and sort
        const products = Array.from(productMap.values()).sort((a, b) => b.netQuantity - a.netQuantity)

        setProductData(products)

        toast({
          title: "Products Loaded",
          description: `Found ${products.length} unique products with detailed sales information`,
        })
      } else {
        throw new Error(result.message || "Failed to load products")
      }
    } catch (error: any) {
      console.error("Fetch error:", error)
      setFetchError(error.message)
      toast({
        title: "Error Loading Products",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return productData

    return productData.filter((product) => product.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [productData, searchTerm])

  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchData()
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const totalQuantity = useMemo(() => filteredProducts.reduce((sum, p) => sum + p.netQuantity, 0), [filteredProducts])
  const totalSales = useMemo(() => filteredProducts.reduce((sum, p) => sum + p.totalSales, 0), [filteredProducts])

  if (isLoading && productData.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading product details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b">
        <h1 className="text-3xl font-bold flex items-center">
          <Package className="mr-3 h-8 w-8" /> Product Details
        </h1>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {/* Error Alert */}
      {fetchError && (
        <Alert variant="destructive">
          <AlertDescription>Error: {fetchError}</AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <RefreshCw className="h-6 w-6 animate-spin inline" />
              ) : (
                filteredProducts.length.toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <RefreshCw className="h-6 w-6 animate-spin inline" /> : totalQuantity.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Sales Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <RefreshCw className="h-6 w-6 animate-spin inline" /> : `₦${totalSales.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table with Details */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <Badge variant="outline" className="text-sm">
              Click any row to view sales details
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Total Quantity</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-center">Sales Count</TableHead>
                  <TableHead className="text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isRefreshing ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin inline mr-2" />
                      Refreshing...
                    </TableCell>
                  </TableRow>
                ) : isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin inline mr-2" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product, index) => (
                    <ProductRow key={`${product.productName}-${index}`} product={product} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
