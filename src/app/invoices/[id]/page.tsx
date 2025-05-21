
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Send, Download, Edit, Box, User } from 'lucide-react';
import type { Invoice } from '@/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      setIsLoading(true);
      setError(null);
      fetch(`https://sajfoods.net/busa-api/database/get_invoice.php?id=${invoiceId}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data : Invoice | {success: boolean, data?: Invoice, message?: string}) => {
          let fetchedInvoice: Invoice | undefined;
          if ('success' in data) { // Response is {success: ..., data: ...}
            if (data.success && data.data) {
              fetchedInvoice = data.data;
            } else {
              throw new Error(data.message || "Failed to fetch invoice data.");
            }
          } else { // Direct invoice object
            fetchedInvoice = data;
          }

          if (fetchedInvoice) {
             // Ensure dates are Date objects
            const formattedInvoice = {
                ...fetchedInvoice,
                issueDate: new Date(fetchedInvoice.issueDate),
                dueDate: new Date(fetchedInvoice.dueDate),
                items: Array.isArray(fetchedInvoice.items) ? fetchedInvoice.items : [], // Ensure items is an array
            };
            setInvoice(formattedInvoice);
          } else {
            setInvoice(null); // Invoice not found
            setError("Invoice not found.");
          }
        })
        .catch(err => {
          console.error("Error fetching invoice:", err);
          setError(err.message || "An unknown error occurred.");
          setInvoice(null);
          toast({title: "Error", description: `Failed to load invoice: ${err.message}`, variant: "destructive"});
        })
        .finally(() => setIsLoading(false));
    }
  }, [invoiceId, toast]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const getStatusBadgeVariant = (status: Invoice['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Paid': return 'default'; case 'Sent': return 'secondary'; case 'Draft': return 'outline';
      case 'Overdue': return 'destructive'; case 'Cancelled': return 'destructive'; default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Loading invoice details...</p></div>;
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center h-full"><p className="text-destructive mb-4">Error: {error}</p>
      <Link href="/invoices" passHref><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Invoices</Button></Link>
    </div>;
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4">Invoice not found.</p>
        <Link href="/invoices" passHref><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Invoices</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/invoices" passHref>
          <Button variant="outline" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span></Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/invoices/${invoice.id}/edit`} passHref><Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button></Link>
          {/* <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
          <Button><Send className="mr-2 h-4 w-4" /> Send Invoice</Button> */}
        </div>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader className="bg-muted/50 p-6">
          <div className="flex justify-between items-start">
            <div>
              {invoice.companyDetails.logoUrl && (
                 <Image 
                    src={invoice.companyDetails.logoUrl.startsWith('https://sajfoods.net') ? invoice.companyDetails.logoUrl : "https://placehold.co/100x40.png"}
                    alt={`${invoice.companyDetails.name} logo`} 
                    width={100} height={40} className="mb-4 h-auto" data-ai-hint="company logo" 
                  />
              )}
              <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
              <Badge variant={getStatusBadgeVariant(invoice.status)} className="mt-1">{invoice.status}</Badge>
            </div>
            <div className="text-right">
              <p className="font-semibold">{invoice.companyDetails.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.companyDetails.address}</p>
              {invoice.companyDetails.phone && <p className="text-sm text-muted-foreground">Phone: {invoice.companyDetails.phone}</p>}
              {invoice.companyDetails.email && <p className="text-sm text-muted-foreground">Email: {invoice.companyDetails.email}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
              <Link href={`/ledger-accounts/${invoice.customer.id}`} passHref>
                <Button variant="link" className="p-0 h-auto text-base font-medium text-primary hover:underline">
                  <User className="mr-2 h-4 w-4" />{invoice.customer.name}
                </Button>
              </Link>
              {invoice.customer.address && <p className="text-sm text-muted-foreground mt-1">{invoice.customer.address}</p>}
              {invoice.customer.email && <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>}
            </div>
            <div className="text-right md:text-left">
              <p><span className="font-semibold">Invoice Date:</span> {format(new Date(invoice.issueDate), 'PPP')}</p>
              <p><span className="font-semibold">Due Date:</span> {format(new Date(invoice.dueDate), 'PPP')}</p>
              {invoice.saleId && <p><span className="font-semibold">Sale ID:</span> {invoice.saleId}</p>}
            </div>
          </div>

          <Table>
            <TableHeader><TableRow>
                <TableHead>Item</TableHead><TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Unit</TableHead><TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(invoice.items || []).map((item, index) => (
                <TableRow key={`${item.productId}-${index}`}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">{item.unitOfMeasure || 'PCS'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(invoice.subTotal)}</span></div>
              {invoice.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between"><span>Discount:</span><span className="text-destructive">-{formatCurrency(invoice.discountAmount)}</span></div>
              )}
              {invoice.taxAmount && invoice.taxAmount > 0 && (
                <div className="flex justify-between"><span>Tax:</span><span>{formatCurrency(invoice.taxAmount)}</span></div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total Amount Due:</span><span>{formatCurrency(invoice.totalAmount)}</span></div>
            </div>
          </div>
          
          {invoice.notes && (
            <div className="mt-8 border-t pt-4">
              <h4 className="font-semibold mb-1">Notes:</h4>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 text-center text-xs text-muted-foreground">
          <p>Thank you for your business! Payments can be made via bank transfer or other approved methods.</p>
          <p>If you have any questions concerning this invoice, please contact {invoice.companyDetails.name} at {invoice.companyDetails.email || invoice.companyDetails.phone}.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
