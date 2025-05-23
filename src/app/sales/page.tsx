"use client";

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle, Search, FileDown, Eye, Edit, Send, Printer, Trash2, RefreshCw } from "lucide-react"
import type { Sale } from "@/types"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
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
import { MoreHorizontal, PlusCircle, Search, FileDown, Eye, Edit, AlertCircle } from "lucide-react"
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

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold">Sales Transactions</h1>
        <div className="flex items-center gap-2">
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

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Sales Log</CardTitle>
          <CardDescription>Manage and track all sales transactions.</CardDescription>
          <form onSubmit={handleSearchSubmit} className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sales by ID, customer, or status..."
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </form>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <p>Loading sales data...</p>
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
              <TableBody>
                {sales.map((sale) => (
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
                          {sale.status !== "Cancelled" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">Cancel Sale</DropdownMenuItem>
                            </>
                          )}
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
