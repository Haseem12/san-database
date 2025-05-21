
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
import { Search, Filter, Eye, DollarSign, ShoppingCart, FileText, ReceiptText, NotebookPen, ClipboardList, Warehouse, Layers, Activity as ActivityIcon } from 'lucide-react';
import type { Sale, Invoice, Receipt, CreditNote, PurchaseOrder, RawMaterialUsageLog } from '@/types';
import { mockSales, mockInvoices, mockReceipts, mockCreditNotes, mockPurchaseOrders, mockRawMaterialUsageLogs, mockLedgerAccounts } from '@/lib/mockData';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

type ActivityType = 'Sale' | 'Invoice' | 'Receipt' | 'Credit Note' | 'Purchase Order' | 'Material Usage';

interface UnifiedActivity {
  id: string;
  date: Date;
  type: ActivityType;
  documentNumber: string;
  description: string;
  amount: number; // Always positive
  balanceEffect: 'increase' | 'decrease' | 'neutral'; // For display purposes mainly
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

  useEffect(() => {
    const salesActivities: UnifiedActivity[] = mockSales.map(s => ({
      id: `sale-${s.id}`,
      date: new Date(s.saleDate),
      type: 'Sale',
      documentNumber: s.id,
      description: `Sale to ${s.customer.name}`,
      amount: s.totalAmount,
      balanceEffect: 'increase', // Represents revenue potential
      status: s.status,
      link: `/sales/${s.id}`,
      customerOrSupplierName: s.customer.name,
    }));

    const invoiceActivities: UnifiedActivity[] = mockInvoices.map(i => ({
      id: `invoice-${i.id}`,
      date: new Date(i.issueDate),
      type: 'Invoice',
      documentNumber: i.invoiceNumber,
      description: `Invoice to ${i.customer.name}`,
      amount: i.totalAmount,
      balanceEffect: 'increase', // Represents receivable
      status: i.status,
      link: `/invoices/${i.id}`,
      customerOrSupplierName: i.customer.name,
    }));

    const receiptActivities: UnifiedActivity[] = mockReceipts.map(r => ({
      id: `receipt-${r.id}`,
      date: new Date(r.receiptDate),
      type: 'Receipt',
      documentNumber: r.receiptNumber,
      description: `Payment from ${r.ledgerAccountName}`,
      amount: r.amountReceived,
      balanceEffect: 'increase', // Cash increase
      link: `/receipts/${r.id}`,
      customerOrSupplierName: r.ledgerAccountName,
    }));

    const creditNoteActivities: UnifiedActivity[] = mockCreditNotes.map(cn => ({
      id: `cn-${cn.id}`,
      date: new Date(cn.creditNoteDate),
      type: 'Credit Note',
      documentNumber: cn.creditNoteNumber,
      description: `${cn.reason} for ${cn.ledgerAccountName}`,
      amount: cn.amount,
      balanceEffect: 'decrease', // Reduces receivable/revenue
      link: `/credit-notes/${cn.id}`,
      customerOrSupplierName: cn.ledgerAccountName,
    }));

    const purchaseOrderActivities: UnifiedActivity[] = mockPurchaseOrders.map(po => ({
      id: `po-${po.id}`,
      date: new Date(po.orderDate),
      type: 'Purchase Order',
      documentNumber: po.poNumber,
      description: `PO to ${po.supplier.name}`,
      amount: po.totalCost,
      balanceEffect: 'decrease', // Represents payable/expense
      status: po.status,
      link: `/purchases/${po.id}`,
      customerOrSupplierName: po.supplier.name,
    }));

    const usageActivities: UnifiedActivity[] = mockRawMaterialUsageLogs.map(u => ({
      id: `usage-${u.id}`,
      date: new Date(u.usageDate),
      type: 'Material Usage',
      documentNumber: u.usageNumber,
      description: `Used ${u.rawMaterialName} for ${u.department}`,
      amount: 0, // Usage itself doesn't have a direct transaction amount, cost is implied
      balanceEffect: 'neutral', // Primarily an inventory movement
      link: `/store/usage`, // Link to the general usage page
      customerOrSupplierName: u.department, // Using department as the "related entity"
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
  }, []);

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
      case 'Receipt': return 'default'; // Different green or primary color could be used
      case 'Credit Note': return 'destructive';
      case 'Purchase Order': return 'outline';
      case 'Material Usage': return 'outline';
      default: return 'outline';
    }
  };

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
            <label htmlFor="fromDate" className="text-sm font-medium">From Date</label>
            <DatePickerComponent date={fromDate} setDate={setFromDate} placeholder="Start date" />
          </div>
          <div>
            <label htmlFor="toDate" className="text-sm font-medium">To Date</label>
            <DatePickerComponent date={toDate} setDate={setToDate} placeholder="End date" />
          </div>
          <div>
            <label htmlFor="typeFilter" className="text-sm font-medium">Activity Type</label>
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
                    <TableCell>{format(new Date(activity.date), 'PP p')}</TableCell>
                    <TableCell><Badge variant={getTypeBadgeVariant(activity.type)}>{activity.type}</Badge></TableCell>
                    <TableCell className="font-medium">{activity.documentNumber}</TableCell>
                    <TableCell className="max-w-xs truncate" title={activity.description}>{activity.description}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={activity.customerOrSupplierName}>{activity.customerOrSupplierName || '-'}</TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      activity.balanceEffect === 'increase' && activity.type !== 'Credit Note' && 'text-green-600',
                      activity.balanceEffect === 'decrease' && 'text-destructive',
                      activity.type === 'Credit Note' && 'text-destructive' // Credit notes are reductions of assets/revenue
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

