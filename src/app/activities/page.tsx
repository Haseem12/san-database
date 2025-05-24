
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerComponent } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Eye, DollarSign, ShoppingCart, FileText, ReceiptText, NotebookPen, ClipboardList, Warehouse, Layers, Activity as ActivityIcon, RefreshCw, AlertCircle } from 'lucide-react';
import type { Sale, Invoice, Receipt, CreditNote, PurchaseOrder, RawMaterialUsageLog } from '@/types';
import { format, startOfDay, endOfDay, isValid, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ActivityType = 'Sale' | 'Invoice' | 'Receipt' | 'Credit Note' | 'Purchase Order' | 'Material Usage';

interface UnifiedActivity {
  id: string;
  date: Date;
  type: ActivityType;
  documentNumber: string;
  description: string;
  amount: number; // Always positive
  balanceEffect: 'increase' | 'decrease' | 'neutral';
  status?: string;
  link: string;
  customerOrSupplierName?: string;
}

const activityTypeOptions: ActivityType[] = ['Sale', 'Invoice', 'Receipt', 'Credit Note', 'Purchase Order', 'Material Usage'];

export default function OverallActivitiesPage() {
  const [allActivities, setAllActivities] = useState<UnifiedActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'All'>('All');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const parseDateString = (dateString: string | undefined | null): Date | null => {
    if (!dateString) return null;
    const parsed = parseISO(String(dateString).replace(" ", "T")); // Handle potential space in datetime string
    return isValid(parsed) ? parsed : null;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const endpoints = [
          'get_sales.php',
          'get_invoices.php',
          'get_receipts.php',
          'get_credit_notes.php',
          'get_purchase_orders.php',
          'get_raw_material_usage_logs.php'
        ];

        const responses = await Promise.all(
          endpoints.map(endpoint => fetch(`https://sajfoods.net/busa-api/database/${endpoint}`))
        );

        const dataPromises = responses.map(async (res, index) => {
          if (!res.ok) {
            const errorText = await res.text().catch(() => `HTTP error! status: ${res.status} for ${endpoints[index]}`);
            throw new Error(`Failed to fetch ${endpoints[index]}: ${errorText}`);
          }
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const responseText = await res.text();
            console.warn(`Non-JSON response from ${endpoints[index]}:`, responseText.substring(0, 100));
            throw new Error(`Expected JSON from ${endpoints[index]}, got ${contentType}`);
          }
          return res.json();
        });

        const [
          salesData,
          invoicesData,
          receiptsData,
          creditNotesData,
          purchaseOrdersData,
          materialUsageData
        ] = await Promise.all(dataPromises);

        const fetchedSales: Sale[] = (salesData.success && Array.isArray(salesData.data)) ? salesData.data : (Array.isArray(salesData) ? salesData : []);
        const fetchedInvoices: Invoice[] = (invoicesData.success && Array.isArray(invoicesData.data)) ? invoicesData.data : (Array.isArray(invoicesData) ? invoicesData : []);
        const fetchedReceipts: Receipt[] = (receiptsData.success && Array.isArray(receiptsData.data)) ? receiptsData.data : (Array.isArray(receiptsData) ? receiptsData : []);
        const fetchedCreditNotes: CreditNote[] = (creditNotesData.success && Array.isArray(creditNotesData.data)) ? creditNotesData.data : (Array.isArray(creditNotesData) ? creditNotesData : []);
        const fetchedPurchaseOrders: PurchaseOrder[] = (purchaseOrdersData.success && Array.isArray(purchaseOrdersData.data)) ? purchaseOrdersData.data : (Array.isArray(purchaseOrdersData) ? purchaseOrdersData : []);
        const fetchedMaterialUsage: RawMaterialUsageLog[] = (materialUsageData.success && Array.isArray(materialUsageData.data)) ? materialUsageData.data : (Array.isArray(materialUsageData) ? materialUsageData : []);

        const salesActivities: UnifiedActivity[] = fetchedSales.map(s => ({
          id: `sale-${s.id}`,
          date: parseDateString(s.saleDate as string) || new Date(),
          type: 'Sale',
          documentNumber: String(s.id),
          description: `Sale to ${s.customer?.name || (s as any).customerName || 'N/A'}`,
          amount: Number(s.totalAmount) || 0,
          balanceEffect: 'increase',
          status: s.status,
          link: `/sales/${s.id}`,
          customerOrSupplierName: s.customer?.name || (s as any).customerName || 'N/A',
        }));

        const invoiceActivities: UnifiedActivity[] = fetchedInvoices.map(i => ({
          id: `invoice-${i.id}`,
          date: parseDateString(i.issueDate as string) || new Date(),
          type: 'Invoice',
          documentNumber: i.invoiceNumber,
          description: `Invoice to ${i.customer?.name || (i as any).customerName || 'N/A'}`,
          amount: Number(i.totalAmount) || 0,
          balanceEffect: 'increase',
          status: i.status,
          link: `/invoices/${i.id}`,
          customerOrSupplierName: i.customer?.name || (i as any).customerName || 'N/A',
        }));

        const receiptActivities: UnifiedActivity[] = fetchedReceipts.map(r => ({
          id: `receipt-${r.id}`,
          date: parseDateString(r.receiptDate as string) || new Date(),
          type: 'Receipt',
          documentNumber: r.receiptNumber,
          description: `Payment from ${r.ledgerAccountName || 'N/A'}`,
          amount: Number(r.amountReceived) || 0,
          balanceEffect: 'increase',
          link: `/receipts/${r.id}`,
          customerOrSupplierName: r.ledgerAccountName || 'N/A',
        }));

        const creditNoteActivities: UnifiedActivity[] = fetchedCreditNotes.map(cn => ({
          id: `cn-${cn.id}`,
          date: parseDateString(cn.creditNoteDate as string) || new Date(),
          type: 'Credit Note',
          documentNumber: cn.creditNoteNumber,
          description: `${cn.reason} for ${cn.ledgerAccountName || 'N/A'}`,
          amount: Number(cn.amount) || 0,
          balanceEffect: 'decrease',
          link: `/credit-notes/${cn.id}`,
          customerOrSupplierName: cn.ledgerAccountName || 'N/A',
        }));

        const purchaseOrderActivities: UnifiedActivity[] = fetchedPurchaseOrders.map(po => ({
          id: `po-${po.id}`,
          date: parseDateString(po.orderDate as string) || new Date(),
          type: 'Purchase Order',
          documentNumber: po.poNumber,
          description: `PO to ${po.supplier?.name || (po as any).supplierName || 'N/A'}`,
          amount: Number(po.totalCost) || 0,
          balanceEffect: 'decrease',
          status: po.status,
          link: `/purchases/${po.id}`,
          customerOrSupplierName: po.supplier?.name || (po as any).supplierName || 'N/A',
        }));

        const usageActivities: UnifiedActivity[] = fetchedMaterialUsage.map(u => ({
          id: `usage-${u.id}`,
          date: parseDateString(u.usageDate as string) || new Date(),
          type: 'Material Usage',
          documentNumber: u.usageNumber,
          description: `Used ${u.rawMaterialName} for ${u.department}`,
          amount: 0, 
          balanceEffect: 'neutral',
          link: `/store/usage`, 
          customerOrSupplierName: u.department,
        }));

        const combined = [
          ...salesActivities,
          ...invoiceActivities,
          ...receiptActivities,
          ...creditNoteActivities,
          ...purchaseOrderActivities,
          ...usageActivities,
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        setAllActivities(combined);
      } catch (err: any) {
        setError(err.message || "Failed to fetch overall activities data.");
        toast({ title: "Error", description: err.message || "Could not load activities.", variant: "destructive" });
        setAllActivities([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [toast]);

  const filteredActivities = useMemo(() => {
    let activities = [...allActivities];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      activities = activities.filter(act =>
        act.documentNumber.toLowerCase().includes(lowerSearchTerm) ||
        act.description.toLowerCase().includes(lowerSearchTerm) ||
        (act.customerOrSupplierName && act.customerOrSupplierName.toLowerCase().includes(lowerSearchTerm)) ||
        act.type.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (fromDate && isValid(fromDate)) {
      activities = activities.filter(act => new Date(act.date) >= startOfDay(fromDate));
    }
    if (toDate && isValid(toDate)) {
      activities = activities.filter(act => new Date(act.date) <= endOfDay(toDate));
    }
    if (typeFilter !== 'All') {
      activities = activities.filter(act => act.type === typeFilter);
    }

    return activities;
  }, [allActivities, searchTerm, fromDate, toDate, typeFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const summaryStats = useMemo(() => {
    const salesTotal = filteredActivities.filter(a => a.type === 'Sale').reduce((sum, a) => sum + a.amount, 0);
    const receiptsTotal = filteredActivities.filter(a => a.type === 'Receipt').reduce((sum, a) => sum + a.amount, 0);
    const creditNotesTotal = filteredActivities.filter(a => a.type === 'Credit Note').reduce((sum, a) => sum + a.amount, 0);
    const purchaseOrdersTotal = filteredActivities.filter(a => a.type === 'Purchase Order').reduce((sum, a) => sum + a.amount, 0);
    return { salesTotal, receiptsTotal, creditNotesTotal, purchaseOrdersTotal };
  }, [filteredActivities]);

  const getTypeBadgeVariant = (type: ActivityType): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'Sale': return 'default';
      case 'Invoice': return 'secondary';
      case 'Receipt': return 'default'; 
      case 'Credit Note': return 'destructive';
      case 'Purchase Order': return 'outline';
      case 'Material Usage': return 'outline';
      default: return 'outline';
    }
  };
  
  const formatDateSafe = (dateInput: Date | string | null | undefined) => {
    if (!dateInput) return "N/A";
    const date = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
    if (!date || !isValid(date)) return "Invalid Date";
    return format(date, 'PP p');
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <RefreshCw className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading overall activities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-lg font-semibold text-destructive">Failed to load activities</p>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()}> 
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex items-center justify-between pb-4 border-b">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ActivityIcon className="h-6 w-6" /> Overall Activities
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Summary (Based on Filters)</CardTitle>
          <CardDescription>Key financial metrics from the filtered activities.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={ShoppingCart} title="Total Sales Value" value={formatCurrency(summaryStats.salesTotal)} />
          <SummaryCard icon={ReceiptText} title="Total Receipts Value" value={formatCurrency(summaryStats.receiptsTotal)} />
          <SummaryCard icon={NotebookPen} title="Total Credit Notes Value" value={formatCurrency(summaryStats.creditNotesTotal)} colorClass="text-destructive" />
          <SummaryCard icon={ClipboardList} title="Total Purchase Orders Value" value={formatCurrency(summaryStats.purchaseOrdersTotal)} colorClass="text-amber-600" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="fromDate" className="text-sm font-medium block mb-1">From Date</label>
            <DatePickerComponent date={fromDate} setDate={setFromDate} placeholder="Start date" />
          </div>
          <div>
            <label htmlFor="toDate" className="text-sm font-medium block mb-1">To Date</label>
            <DatePickerComponent date={toDate} setDate={setToDate} placeholder="End date" />
          </div>
          <div>
            <label htmlFor="typeFilter" className="text-sm font-medium block mb-1">Activity Type</label>
            <Select value={typeFilter} onValueChange={(value: ActivityType | 'All') => setTypeFilter(value)}>
              <SelectTrigger id="typeFilter"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                {activityTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="relative self-end">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search activities..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredActivities.length} of {allActivities.length} total activities based on active filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Document #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Related To</TableHead>
                <TableHead className="text-right">Amount (NGN)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{formatDateSafe(activity.date)}</TableCell>
                    <TableCell><Badge variant={getTypeBadgeVariant(activity.type)}>{activity.type}</Badge></TableCell>
                    <TableCell className="font-medium">{activity.documentNumber}</TableCell>
                    <TableCell className="max-w-xs truncate" title={activity.description}>{activity.description}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={activity.customerOrSupplierName}>{activity.customerOrSupplierName || '-'}</TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      activity.balanceEffect === 'increase' && activity.type !== 'Credit Note' && 'text-green-600',
                      activity.balanceEffect === 'decrease' && 'text-destructive',
                      activity.type === 'Credit Note' && 'text-destructive' 
                    )}>
                      {activity.amount > 0 ? (activity.type === 'Credit Note' || activity.type === 'Purchase Order' ? `-${formatCurrency(activity.amount)}` : formatCurrency(activity.amount)) : (activity.type === 'Material Usage' ? 'N/A' : formatCurrency(0))}
                    </TableCell>
                    <TableCell>
                      {activity.status ? <Badge variant={activity.status === 'Paid' || activity.status === 'Completed' || activity.status === 'Received' ? 'default' : activity.status === 'Cancelled' || activity.status === 'Overdue' ? 'destructive' : 'secondary' }>{activity.status}</Badge> : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={activity.link} passHref>
                        <Button variant="outline" size="sm"><Eye className="mr-1 h-3.5 w-3.5" /> View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No activities match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">End of list.</div>
        </CardFooter>
      </Card>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  colorClass?: string;
}
const SummaryCard: React.FC<SummaryCardProps> = ({ icon: Icon, title, value, colorClass = "text-primary" }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={cn("h-5 w-5", colorClass)} />
    </CardHeader>
    <CardContent>
      <div className={cn("text-2xl font-bold", colorClass)}>{value}</div>
    </CardContent>
  </Card>
);
