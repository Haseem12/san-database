"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import type { Invoice } from "@/types"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface PrintInvoiceProps {
  invoice: Invoice
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function PrintInvoice({ invoice, variant = "outline", size = "default" }: PrintInvoiceProps) {
  const { toast } = useToast()

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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600")

    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow popups to print invoices.",
        variant: "destructive",
      })
      return
    }

    const printContent = generatePrintableInvoice(invoice)

    printWindow.document.write(printContent)
    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const generatePrintableInvoice = (invoice: Invoice): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
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
          
          .invoice-info {
            text-align: right;
          }
          
          .invoice-info h2 {
            font-size: 28px;
            color: #333;
            margin-bottom: 15px;
            font-weight: 300;
            letter-spacing: 2px;
          }
          
          .invoice-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .bill-to, .invoice-meta {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }
          
          .bill-to h3, .invoice-meta h3 {
            margin-bottom: 15px;
            color: #2563eb;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          
          .bill-to p, .invoice-meta p {
            margin: 8px 0;
            font-size: 14px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          
          .items-table th,
          .items-table td {
            padding: 15px 12px;
            text-align: left;
          }
          
          .items-table th {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          
          .items-table tbody tr {
            border-bottom: 1px solid #e5e7eb;
          }
          
          .items-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          .items-table tbody tr:hover {
            background-color: #f3f4f6;
          }
          
          .items-table .text-right {
            text-align: right;
          }
          
          .totals {
            margin-left: auto;
            width: 350px;
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          
          .totals-row.total {
            font-weight: bold;
            font-size: 20px;
            border-bottom: 2px solid #2563eb;
            margin-top: 15px;
            padding-top: 15px;
            color: #2563eb;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 25px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status-paid { background: #dcfce7; color: #166534; }
          .status-sent { background: #dbeafe; color: #1e40af; }
          .status-draft { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
          .status-overdue { background: #fef2f2; color: #dc2626; }
          .status-cancelled { background: #fef2f2; color: #dc2626; }
          
          .notes {
            margin-top: 40px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }
          
          .notes h3 {
            margin-bottom: 15px;
            color: #2563eb;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
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
          
          .footer .thank-you {
            font-size: 18px;
            color: #2563eb;
            font-weight: 600;
            margin-bottom: 10px;
          }
          
          @media print {
            body {
              padding: 20px;
              font-size: 12px;
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
            
            .totals {
              page-break-inside: avoid;
            }
            
            .notes {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>SAJ Foods</h1>
            <p>123 Business Street</p>
            <p>Lagos, Nigeria</p>
            <p>Phone: +234 (0) 123 456 7890</p>
            <p>Email: info@sajfoods.net</p>
            <p>Website: www.sajfoods.net</p>
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span></p>
          </div>
        </div>
        
        <div class="invoice-details">
          <div class="bill-to">
            <h3>Bill To</h3>
            <p><strong>${invoice.customer.name}</strong></p>
            ${invoice.customer.email ? `<p>📧 ${invoice.customer.email}</p>` : ""}
            ${invoice.customer.address ? `<p>📍 ${invoice.customer.address}</p>` : ""}
            ${invoice.customer.phone ? `<p>📞 ${invoice.customer.phone}</p>` : ""}
          </div>
          
          <div class="invoice-meta">
            <h3>Invoice Details</h3>
            <p><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</p>
            <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
            <p><strong>Payment Terms:</strong> Net 30 Days</p>
            <p><strong>Currency:</strong> Nigerian Naira (₦)</p>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th class="text-right" style="width: 15%;">Qty</th>
              <th class="text-right" style="width: 20%;">Unit Price</th>
              <th class="text-right" style="width: 15%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoice.items?.length
                ? invoice.items
                    .map(
                      (item) => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right"><strong>${formatCurrency(item.total)}</strong></td>
                </tr>
              `,
                    )
                    .join("")
                : '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #666;">No items found</td></tr>'
            }
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(invoice.subtotal || 0)}</span>
          </div>
          <div class="totals-row">
            <span>Tax (${((invoice.tax || 0) / (invoice.subtotal || 1)) * 100}%):</span>
            <span>${formatCurrency(invoice.tax || 0)}</span>
          </div>
          <div class="totals-row total">
            <span>Total Amount:</span>
            <span>${formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>
        
        ${
          invoice.notes
            ? `
          <div class="notes">
            <h3>Notes & Terms</h3>
            <p>${invoice.notes}</p>
          </div>
        `
            : ""
        }
        
        <div class="footer">
          <p class="thank-you">Thank you for your business!</p>
          <p>For questions about this invoice, please contact us at info@sajfoods.net</p>
          <p>Payment is due within 30 days of invoice date.</p>
        </div>
      </body>
      </html>
    `
  }

  return (
    <Button variant={variant} size={size} onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Print Invoice
    </Button>
  )
}
