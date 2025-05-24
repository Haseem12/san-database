"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  MapPin,
  CalendarDays,
  Banknote,
  Tag,
  Eye,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  NotebookPen,
  Landmark,
  RefreshCw,
  Printer,
  FileText,
} from "lucide-react"
import { format } from "date-fns"
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
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { LedgerAccount as LedgerAccountTypeFromTypes } from "@/types"

interface AccountActivity {
  id: string
  date: Date
  type: "Invoice" | "Receipt" | "Credit Note"
  documentNumber: string
  description: string
  amount: number
  status?: string
  detailsLink: string
}

interface LedgerAccount extends LedgerAccountTypeFromTypes {}

// Fallback data for when API is unavailable
const generateFallbackData = (accountId: string) => {
  const fallbackAccount: LedgerAccount = {
    id: accountId,
    accountCode: `ACC-${accountId.padStart(4, "0")}`,
    name: `Customer Account ${accountId}`,
    accountType: "Customer",
    phone: "+234 123 456 7890",
    address: "123 Business Street, Lagos, Nigeria",
    priceLevel: "Standard",
    zone: "Lagos Zone",
    creditPeriod: 30,
    creditLimit: 500000,
    bankDetails: "First Bank Nigeria\nAccount: 1234567890\nSort Code: 011",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:45:00Z",
  }

  const fallbackInvoices = [
    {
      id: "inv-001",
      invoiceNumber: "INV-2024-001",
      issueDate: "2024-01-15T00:00:00Z",
      customerName: fallbackAccount.name,
      totalAmount: 150000,
      status: "Paid",
    },
    {
      id: "inv-002",
      invoiceNumber: "INV-2024-002",
      issueDate: "2024-01-20T00:00:00Z",
      customerName: fallbackAccount.name,
      totalAmount: 200000,
      status: "Sent",
    },
  ]

  const fallbackReceipts = [
    {
      id: "rec-001",
      receiptNumber: "REC-2024-001",
      receiptDate: "2024-01-18T00:00:00Z",
      paymentMethod: "Bank Transfer",
      amountReceived: 150000,
      status: "Completed",
    },
  ]

  const fallbackCreditNotes = [
    {
      id: "cn-001",
      creditNoteNumber: "CN-2024-001",
      creditNoteDate: "2024-01-22T00:00:00Z",
      reason: "Product Return",
      description: "Defective items returned",
      amount: 25000,
      status: "Approved",
    },
  ]

  const totalInvoiced = fallbackInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalReceived = fallbackReceipts.reduce((sum, rec) => sum + rec.amountReceived, 0)
  const totalCredited = fallbackCreditNotes.reduce((sum, cn) => sum + cn.amount, 0)
  const outstandingBalance = totalInvoiced - totalReceived - totalCredited

  return {
    success: true,
    account: fallbackAccount,
    invoices: fallbackInvoices,
    receipts: fallbackReceipts,
    creditNotes: fallbackCreditNotes,
    totalInvoiced,
    totalReceived,
    totalCredited,
    outstandingBalance,
  }
}

export default function LedgerAccountDetailPage() {
  const params = useParams()
  const accountId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [account, setAccount] = useState<LedgerAccount | null>(null)
  const [activities, setActivities] = useState<AccountActivity[]>([])
  const [outstandingBalance, setOutstandingBalance] = useState(0)
  const [totalInvoiced, setTotalInvoiced] = useState(0)
  const [totalReceived, setTotalReceived] = useState(0)
  const [totalCredited, setTotalCredited] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  useEffect(() => {
    if (!accountId) {
      setError("Account ID is missing.")
      setLoading(false)
      return
    }

    async function loadAccountDetails() {
      setLoading(true)
      setError(null)
      setIsUsingFallback(false)

      // Try multiple API endpoints in order of preference
      const apiEndpoints = [
        `https://sajfoods.net/busa-api/database/get_ledger_account_d.php?id=${accountId}`,
        `https://sajfoods.net/busa-api/database/get_ledger_account_detail.php?id=${accountId}`,
        `https://sajfoods.net/busa-api/database/getLedgerAccountDetail.php?id=${accountId}`,
      ]

      let lastError = null

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Attempting to fetch from: ${endpoint}`)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

          const res = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          })

          clearTimeout(timeoutId)

          console.log(`Response status: ${res.status}`)

          if (!res.ok) {
            const errorText = await res.text()
            console.log(`Error response: ${errorText}`)
            throw new Error(`HTTP ${res.status}: ${res.statusText}${errorText ? ` - ${errorText}` : ""}`)
          }

          const contentType = res.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            const responseText = await res.text()
            console.log(`Non-JSON response: ${responseText}`)
            throw new Error(`Expected JSON response, got ${contentType}`)
          }

          const json = await res.json()
          console.log("API Response:", json)

          if (!json.success) {
            throw new Error(json.message || "API returned unsuccessful response")
          }

          // Successfully got data from API
          setAccount(json.account)
          setTotalInvoiced(Number.parseFloat(json.totalInvoiced?.toString() || "0") || 0)
          setTotalReceived(Number.parseFloat(json.totalReceived?.toString() || "0") || 0)
          setTotalCredited(Number.parseFloat(json.totalCredited?.toString() || "0") || 0)
          setOutstandingBalance(Number.parseFloat(json.outstandingBalance?.toString() || "0") || 0)

          // Process activities from API data
          const allActivities = processActivities(json.invoices || [], json.receipts || [], json.creditNotes || [])
          setActivities(allActivities)
          setLoading(false)
          return // Success, exit the function
        } catch (apiError: any) {
          console.warn(`Failed to fetch from ${endpoint}:`, apiError.message)
          lastError = apiError
          continue // Try next endpoint
        }
      }

      // All API endpoints failed, use fallback data
      console.log("All API endpoints failed, using fallback data")
      const fallbackData = generateFallbackData(accountId)

      setAccount(fallbackData.account)
      setTotalInvoiced(fallbackData.totalInvoiced)
      setTotalReceived(fallbackData.totalReceived)
      setTotalCredited(fallbackData.totalCredited)
      setOutstandingBalance(fallbackData.outstandingBalance)

      // Process activities from fallback data
      const allActivities = processActivities(
        fallbackData.invoices || [],
        fallbackData.receipts || [],
        fallbackData.creditNotes || [],
      )
      setActivities(allActivities)
      setIsUsingFallback(true)

      toast({
        title: "Using Demo Data",
        description: "API is unavailable. Showing demo data for preview.",
        variant: "default",
      })

      setLoading(false)
    }

    loadAccountDetails()
  }, [accountId, toast])

  // Helper function to process activities from different sources
  const processActivities = (invoices: any[], receipts: any[], creditNotes: any[]): AccountActivity[] => {
    // Safely map activities with comprehensive error handling
    const mapActivity = (
      item: any,
      type: "Invoice" | "Receipt" | "Credit Note",
      dateField: string,
      numberField: string,
      descriptionFn: (item: any) => string,
      linkPrefix: string,
    ): AccountActivity => {
      try {
        const dateValue = item[dateField] || item.date || new Date().toISOString()
        const date = new Date(dateValue)

        // Validate date
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date for ${type} ID ${item.id}: ${dateValue}`)
          return {
            id: `error-${Date.now()}-${Math.random()}`,
            date: new Date(),
            type,
            documentNumber: item.invoiceNumber || item.receiptNumber || item.creditNoteNumber || "Unknown",
            description: "Invalid date",
            amount: Number.parseFloat(item[numberField]?.toString() || "0") || 0,
            status: item.status || undefined,
            detailsLink: `${linkPrefix}/${item.id}`,
          }
        }

        return {
          id: item.id || `temp-${Date.now()}-${Math.random()}`,
          date,
          type,
          documentNumber: item.invoiceNumber || item.receiptNumber || item.creditNoteNumber || "Unknown",
          description: descriptionFn(item),
          amount: Number.parseFloat(item[numberField]?.toString() || "0") || 0,
          status: item.status || undefined,
          detailsLink: `${linkPrefix}/${item.id}`,
        }
      } catch (err) {
        console.error(`Error mapping ${type}:`, err, item)
        // Return a safe fallback object
        return {
          id: `error-${Date.now()}-${Math.random()}`,
          date: new Date(),
          type,
          documentNumber: "Error",
          description: "Error processing this item",
          amount: 0,
          status: "Error",
          detailsLink: "#",
        }
      }
    }

    const mappedInvoices: AccountActivity[] = invoices.map((inv: any) =>
      mapActivity(
        inv,
        "Invoice",
        "issueDate",
        "totalAmount",
        (item) => `Invoice to ${item.customerName || "Customer"}`,
        "/invoices",
      ),
    )

    const mappedReceipts: AccountActivity[] = receipts.map((r: any) =>
      mapActivity(
        r,
        "Receipt",
        "receiptDate",
        "amountReceived",
        (item) => `Payment via ${item.paymentMethod || "Unknown"}`,
        "/receipts",
      ),
    )

    const mappedCreditNotes: AccountActivity[] = creditNotes.map((cn: any) =>
      mapActivity(
        cn,
        "Credit Note",
        "creditNoteDate",
        "amount",
        (item) => `${item.reason || "Credit"}: ${item.description || ""}`,
        "/credit-notes",
      ),
    )

    // Sort activities by date safely
    const allActivities = [...mappedInvoices, ...mappedReceipts, ...mappedCreditNotes]
    allActivities.sort((a, b) => {
      try {
        return b.date.getTime() - a.date.getTime()
      } catch (err) {
        return 0
      }
    })

    return allActivities
  }

  const formatCurrency = (amt: number | undefined | null) => {
    if (amt === undefined || amt === null || isNaN(amt)) return "₦0.00"
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amt)
  }

  const creditStatus = useMemo(() => {
    if (!account || account.creditLimit === undefined || account.creditLimit === null || account.creditLimit === 0) {
      return { color: "", msg: "No credit limit set or N/A." }
    }
    const limit = account.creditLimit
    const usagePercentage = (outstandingBalance / limit) * 100

    if (outstandingBalance >= limit)
      return { color: "text-destructive font-semibold", msg: "Credit limit reached/exceeded!" }
    if (usagePercentage >= 80) return { color: "text-orange-500 font-medium", msg: "Nearing credit limit." }
    return { color: outstandingBalance > 0 ? "text-amber-600" : "text-green-600", msg: "Within credit limit." }
  }, [account, outstandingBalance])

  const handleDelete = async () => {
    if (!account) return

    if (isUsingFallback) {
      toast({
        title: "Demo Mode",
        description: "Delete functionality is not available in demo mode.",
        variant: "default",
      })
      router.push("/ledger-accounts")
      return
    }

    try {
      const response = await fetch("https://sajfoods.net/busa-api/database/delete_ledger_account.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: account.id }),
      })
      const result = await response.json()
      if (result.success) {
        toast({
          title: "Account Deleted",
          description: `Ledger account "${account.name}" has been removed.`,
        })
        router.push("/ledger-accounts")
      } else {
        throw new Error(result.message || "Failed to delete account from server.")
      }
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" })
      console.error("Error deleting ledger account:", error)
    }
  }

  const formatDate = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return "N/A"

    try {
      const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue

      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("Invalid date value:", dateValue)
        return "Invalid Date"
      }

      return format(date, "PPP")
    } catch (error) {
      console.error("Date formatting error:", error, dateValue)
      return "Invalid Date"
    }
  }

  const generateAccountStatement = () => {
    if (!account) return

    // Create a new window for printing
    const printWindow = window.open("", "_blank", "width=800,height=600")

    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow popups to print account statement.",
        variant: "destructive",
      })
      return
    }

    // Sort activities by date (oldest first) for the statement
    const sortedActivities = [...activities].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate running balance
    let runningBalance = 0
    const activitiesWithBalance = sortedActivities.map((activity) => {
      const amount =
        activity.type === "Invoice"
          ? activity.amount
          : activity.type === "Receipt"
            ? -activity.amount
            : -activity.amount
      runningBalance += amount
      return { ...activity, runningBalance }
    })

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Statement - ${account.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          
          .company-info h1 {
            color: #2563eb;
            font-size: 32px;
            margin-bottom: 8px;
            font-weight: 700;
          }
          
          .company-info p {
            color: #666;
            margin: 3px 0;
            font-size: 14px;
          }
          
          .statement-info {
            text-align: right;
          }
          
          .statement-info h2 {
            font-size: 28px;
            color: #333;
            margin-bottom: 15px;
            font-weight: 300;
            letter-spacing: 2px;
          }
          
          .statement-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          .account-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .account-info, .summary-info {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }
          
          .account-info h3, .summary-info h3 {
            margin-bottom: 15px;
            color: #2563eb;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          
          .account-info p, .summary-info p {
            margin: 8px 0;
            font-size: 14px;
          }
          
          .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          
          .transactions-table th,
          .transactions-table td {
            padding: 15px 12px;
            text-align: left;
          }
          
          .transactions-table th {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          
          .transactions-table tbody tr {
            border-bottom: 1px solid #e5e7eb;
          }
          
          .transactions-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          .transactions-table tbody tr:hover {
            background-color: #f3f4f6;
          }
          
          .transactions-table .text-right {
            text-align: right;
          }
          
          .transactions-table .positive {
            color: #166534;
          }
          
          .transactions-table .negative {
            color: #dc2626;
          }
          
          .footer {
            margin-top: 60px;
            text-align: center;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
          }
          
          .footer p {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
          }
          
          @media print {
            body {
              padding: 20px;
              font-size: 12px;
            }
            
            .header {
              page-break-inside: avoid;
            }
            
            .transactions-table {
              page-break-inside: auto;
            }
            
            .transactions-table tr {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>SAJ Foods Limited RC No. RC510611L</h1>
            <p>KM 142 Kano-Kaduna Expressway, Maraban Gwanda Sabon-Gari</p>
            <p>Zaria, Kaduna State, Nigeria</p>
            <p>Phone: +234 (0) 817 070 7020,  +234 (0) 807 654 5454</p>
            <p>Email: info@sajfoods.net</p>
            <p>Website: sajfoods.net</p>
          </div>
          <div class="statement-info">
            <h2>ACCOUNT STATEMENT</h2>
            <p><strong>Statement Date:</strong> ${format(new Date(), "PPP")}</p>
            <p><strong>Account Code:</strong> ${account.accountCode}</p>
            ${isUsingFallback ? "<p><strong>Mode:</strong> Demo Data</p>" : ""}
          </div>
        </div>
        
        <div class="account-details">
          <div class="account-info">
            <h3>Account Information</h3>
            <p><strong>${account.name}</strong></p>
            <p><strong>Account Type:</strong> ${account.accountType}</p>
            ${account.phone ? `<p><strong>Phone:</strong> ${account.phone}</p>` : ""}
            ${account.address ? `<p><strong>Address:</strong> ${account.address}</p>` : ""}
            ${account.priceLevel ? `<p><strong>Price Level:</strong> ${account.priceLevel}</p>` : ""}
            ${account.zone ? `<p><strong>Zone:</strong> ${account.zone}</p>` : ""}
          </div>
          
          <div class="summary-info">
            <h3>Financial Summary</h3>
            <p><strong>Total Invoiced:</strong> ${formatCurrency(totalInvoiced)}</p>
            <p><strong>Total Received:</strong> ${formatCurrency(totalReceived)}</p>
            <p><strong>Total Credited:</strong> ${formatCurrency(totalCredited)}</p>
            <p><strong>Outstanding Balance:</strong> <span style="color: ${outstandingBalance > 0 ? "#dc2626" : "#166534"}">${formatCurrency(outstandingBalance)}</span></p>
            <p><strong>Credit Limit:</strong> ${formatCurrency(account.creditLimit)}</p>
            <p><strong>Credit Period:</strong> ${account.creditPeriod || 0} days</p>
          </div>
        </div>
        
        <h3 style="margin-bottom: 15px; font-size: 18px;">Transaction History</h3>
        
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Document #</th>
              <th>Description</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${
              activitiesWithBalance.length > 0
                ? activitiesWithBalance
                    .map(
                      (activity) => `
                <tr>
                  <td>${format(activity.date, "yyyy-MM-dd")}</td>
                  <td>${activity.type}</td>
                  <td>${activity.documentNumber}</td>
                  <td>${activity.description}</td>
                  <td class="text-right ${activity.type === "Invoice" ? "positive" : "negative"}">
                    ${activity.type === "Invoice" ? formatCurrency(activity.amount) : `-${formatCurrency(activity.amount)}`}
                  </td>
                  <td class="text-right ${activity.runningBalance >= 0 ? "positive" : "negative"}">
                    ${formatCurrency(activity.runningBalance)}
                  </td>
                </tr>
              `,
                    )
                    .join("")
                : '<tr><td colspan="6" style="text-align: center; padding: 20px;">No transaction history found</td></tr>'
            }
          </tbody>
        </table>
        
        <div class="footer">
          <p>This statement reflects the account status as of ${format(new Date(), "PPP")}.</p>
          <p>For questions about this statement, please contact us at info@sajfoods.net</p>
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading account details...</p>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Ledger account not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {isUsingFallback && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-blue-800 text-sm">
              <strong>Demo Mode:</strong> API is unavailable. Showing sample data for preview purposes.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href="/ledger-accounts">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAccountStatement}>
            <FileText className="mr-2 h-4 w-4" />
            Account Statement
          </Button>
          <Link href={`/ledger-accounts/${account.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Account
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete ledger account &quot;{account.name}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/50">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{account.name}</CardTitle>
              <Badge
                variant={
                  account.accountType === "Customer" || account.accountType === "Sales Rep" ? "default" : "secondary"
                }
                className="mt-1"
              >
                {account.accountType}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground sm:text-right mt-2 sm:mt-0">
              <p>
                Code: <span className="font-medium text-foreground">{account.accountCode}</span>
              </p>
              {account.createdAt && <p>Created: {formatDate(account.createdAt)}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid md:grid-cols-2 gap-x-8 gap-y-4">
          <InfoItem icon={Phone} label="Phone" value={account.phone || "N/A"} />
          <InfoItem
            icon={MapPin}
            label="Address"
            value={account.address || "N/A"}
            fullWidth={!!account.address && account.address.length > 50}
          />
          <InfoItem icon={Tag} label="Price Level" value={account.priceLevel || "N/A"} />
          <InfoItem icon={Tag} label="Zone" value={account.zone || "N/A"} />
          <InfoItem icon={CalendarDays} label="Credit Period" value={`${account.creditPeriod || 0} days`} />
          <InfoItem icon={Banknote} label="Credit Limit" value={formatCurrency(account.creditLimit)} />
          <InfoItem
            icon={Landmark}
            label="Bank Details"
            value={account.bankDetails || "N/A"}
            fullWidth={!!account.bankDetails && account.bankDetails.length > 50}
            isTextarea
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryItem icon={TrendingUp} label="Total Invoiced" value={formatCurrency(totalInvoiced)} />
          <SummaryItem
            icon={TrendingDown}
            label="Total Received"
            value={formatCurrency(totalReceived)}
            colorClass="text-green-600"
          />
          <SummaryItem
            icon={NotebookPen}
            label="Total Credited"
            value={formatCurrency(totalCredited)}
            colorClass="text-orange-500"
          />
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
              <AlertCircle className={cn("h-5 w-5", creditStatus.color)} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", creditStatus.color)}>{formatCurrency(outstandingBalance)}</div>
              <p className={cn("text-xs", creditStatus.color || "text-muted-foreground")}>{creditStatus.msg}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction Activity</CardTitle>
            <CardDescription>Recent invoices, receipts, and credit notes related to this account.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={generateAccountStatement}>
            <Printer className="mr-2 h-4 w-4" />
            Print Statement
          </Button>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Doc #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount (NGN)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{format(new Date(activity.date), "PP")}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          activity.type === "Invoice"
                            ? "secondary"
                            : activity.type === "Receipt"
                              ? "default"
                              : "destructive"
                        }
                      >
                        {activity.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{activity.documentNumber}</TableCell>
                    <TableCell className="max-w-xs truncate" title={activity.description}>
                      {activity.description}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        activity.type === "Receipt" && "text-green-600",
                        activity.type === "Credit Note" && "text-orange-500",
                        activity.type === "Invoice" && "text-blue-600",
                      )}
                    >
                      {activity.type === "Credit Note" || activity.type === "Receipt"
                        ? `-${formatCurrency(activity.amount)}`
                        : formatCurrency(activity.amount)}
                    </TableCell>
                    <TableCell>
                      {activity.status ? (
                        <Badge
                          variant={
                            activity.status === "Paid" ||
                            activity.status === "Completed" ||
                            activity.status === "Received"
                              ? "default"
                              : activity.status === "Cancelled" || activity.status === "Overdue"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {activity.status}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={activity.detailsLink} passHref>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No transaction activities found for this account.</p>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">End of activity list.</div>
        </CardFooter>
      </Card>
    </div>
  )
}

interface InfoItemProps {
  icon: React.ElementType
  label: string
  value: string | number | undefined
  className?: string
  fullWidth?: boolean
  isTextarea?: boolean
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, className, fullWidth, isTextarea }) => (
  <div className={cn("flex items-start gap-3 py-2", fullWidth ? "sm:col-span-2" : "")}>
    <Icon className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
    <div>
      <p className="font-medium text-sm text-muted-foreground">{label}</p>
      {isTextarea ? (
        <p className={cn("text-foreground whitespace-pre-wrap text-sm", className)}>
          {value !== undefined && value !== null ? String(value) : "N/A"}
        </p>
      ) : (
        <p className={cn("text-foreground text-sm", className)}>
          {value !== undefined && value !== null ? String(value) : "N/A"}
        </p>
      )}
    </div>
  </div>
)

interface SummaryItemProps {
  icon: React.ElementType
  label: string
  value: string
  colorClass?: string
}

const SummaryItem: React.FC<SummaryItemProps> = ({ icon: Icon, label, value, colorClass = "text-primary" }) => (
  <Card className="shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <Icon className={cn("h-5 w-5", colorClass)} />
    </CardHeader>
    <CardContent>
      <div className={cn("text-2xl font-bold", colorClass)}>
        {value !== undefined && value !== null ? String(value) : "N/A"}
      </div>
    </CardContent>
  </Card>
)
