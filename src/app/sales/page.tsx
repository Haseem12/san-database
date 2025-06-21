"use client"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, PlusCircle, Search, FileDown, RefreshCw, AlertCircle } from "lucide-react"
import type { Sale } from "@/types"
import { format } from "date-fns"

// Update the API configuration to use your specific endpoint
const API_BASE_URL = "https://sajfoods.net"
const SALES_ENDPOINT = `${API_BASE_URL}/busa-api/database/get_sales.php`

interface ApiResponse {
  data: Sale[]
  total: number
  page: number
  limit: number
}

interface ApiError {
  message: string
  status: number
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update the fetchSales function to handle the PHP API response format
  const fetchSales = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const response = await fetch(SALES_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add any required headers for your API
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Handle different possible response formats from your PHP API
      let salesData = []
      if (Array.isArray(result)) {
        salesData = result
      } else if (result.data && Array.isArray(result.data)) {
        salesData = result.data
      } else if (result.sales && Array.isArray(result.sales)) {
        salesData = result.sales
      }

      setSales(salesData)
    } catch (err) {
      console.error("Error fetching sales:", err)
      setError({
        message: err instanceof Error ? err.message : "Failed to fetch sales data",
        status: err instanceof Error && "status" in err ? (err as any).status : 500,
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Update the cancelSale function to use your API endpoint
  const cancelSale = async (saleId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/busa-api/database/cancel_sale.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sale_id: saleId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to cancel sale: ${response.status}`)
      }

      // Refresh the sales list after cancellation
      await fetchSales(true)
    } catch (err) {
      console.error("Error cancelling sale:", err)
      alert("Failed to cancel sale. Please try again.")
    }
  }

  useEffect(() => {
    fetchSales()
  }, [])

  // Normalise values before filtering ­– prevents “toLowerCase is not a function”
  const searchTermLower = searchTerm.toLowerCase()

  const filteredSales = sales.filter((sale) => {
    const idMatch = String(sale.id ?? "")
      .toLowerCase()
      .includes(searchTermLower)
    const customerMatch = String(sale.customer?.name ?? "")
      .toLowerCase()
      .includes(searchTermLower)
    const statusMatch = String(sale.status ?? "")
      .toLowerCase()
      .includes(searchTermLower)
    return idMatch || customerMatch || statusMatch
  })

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleRefresh = () => {
    fetchSales(true)
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

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <TableBody>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold">Sales Transactions</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Sales
          </Button>
          <Link href="/sales/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </Link>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message}.
            <Button variant="link" className="p-0 h-auto ml-2 text-destructive underline" onClick={() => fetchSales()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Sales Log</CardTitle>
          <CardDescription>Manage and track all sales transactions.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sales by ID, customer, or status..."
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={isLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No sales found matching your search." : "No sales data available."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell>{sale.customer.name}</TableCell>
                      <TableCell>{format(new Date(sale.saleDate), "PP")}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(sale.status)}>{sale.status}</Badge>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => cancelSale(sale.id)}
                              disabled={sale.status === "Cancelled"}
                            >
                              Cancel Sale
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredSales.length}</strong> of <strong>{sales.length}</strong> sales
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
