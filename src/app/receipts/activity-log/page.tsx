
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerComponent } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Receipt, ReceiptPaymentMethod } from '@/types';
import { mockReceipts, mockLedgerAccounts } from '@/lib/mockData';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { Download } from 'lucide-react';

type PaymentFilterType = 'All' | 'Cash' | 'Bank';

export default function ReceiptActivityLogPage() {
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentFilterType>('All');

  useEffect(() => {
    // Populate ledgerAccountName for receipts if missing (for mock data consistency)
    const populatedReceipts = mockReceipts.map(receipt => {
      if (!receipt.ledgerAccountName) {
        const account = mockLedgerAccounts.find(acc => acc.id === receipt.ledgerAccountId);
        return { ...receipt, ledgerAccountName: account?.name || 'Unknown Account' };
      }
      return receipt;
    });
    setAllReceipts(populatedReceipts);
  }, []);

  useEffect(() => {
    let receipts = [...allReceipts];

    if (fromDate && isValid(fromDate)) {
      const startDate = startOfDay(fromDate);
      receipts = receipts.filter(r => new Date(r.receiptDate) >= startDate);
    }

    if (toDate && isValid(toDate)) {
      const endDate = endOfDay(toDate);
      receipts = receipts.filter(r => new Date(r.receiptDate) <= endDate);
    }

    if (paymentMethodFilter === 'Cash') {
      receipts = receipts.filter(r => r.paymentMethod === 'Cash');
    } else if (paymentMethodFilter === 'Bank') {
      const bankPaymentMethods: ReceiptPaymentMethod[] = ['Card', 'Transfer', 'Online', 'Cheque'];
      receipts = receipts.filter(r => bankPaymentMethods.includes(r.paymentMethod));
    }

    setFilteredReceipts(receipts);
  }, [allReceipts, fromDate, toDate, paymentMethodFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const totalAmountFiltered = useMemo(() => {
    return filteredReceipts.reduce((sum, receipt) => sum + receipt.amountReceived, 0);
  }, [filteredReceipts]);

  const totalCashAmount = useMemo(() => {
    return filteredReceipts
      .filter(r => r.paymentMethod === 'Cash')
      .reduce((sum, receipt) => sum + receipt.amountReceived, 0);
  }, [filteredReceipts]);

  const totalBankAmount = useMemo(() => {
    const bankPaymentMethods: ReceiptPaymentMethod[] = ['Card', 'Transfer', 'Online', 'Cheque'];
    return filteredReceipts
      .filter(r => bankPaymentMethods.includes(r.paymentMethod))
      .reduce((sum, receipt) => sum + receipt.amountReceived, 0);
  }, [filteredReceipts]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex items-center justify-between pb-4 border-b">
        <h1 className="text-2xl font-semibold">Receipt Activity Log</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Log
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter receipts by date range and payment method.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="fromDate">From Date</Label>
            <DatePickerComponent date={fromDate} setDate={setFromDate} placeholder="Start date" />
          </div>
          <div>
            <Label htmlFor="toDate">To Date</Label>
            <DatePickerComponent date={toDate} setDate={setToDate} placeholder="End date" />
          </div>
          <div>
            <Label htmlFor="paymentMethodFilter">Payment Method</Label>
            <Select value={paymentMethodFilter} onValueChange={(value: PaymentFilterType) => setPaymentMethodFilter(value)}>
              <SelectTrigger id="paymentMethodFilter">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Payments</SelectItem>
                <SelectItem value="Cash">Cash Payments</SelectItem>
                <SelectItem value="Bank">Bank Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Receipts (Filtered)</p>
            <p className="font-semibold text-lg">{filteredReceipts.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Amount (Filtered)</p>
            <p className="font-semibold text-lg text-green-600">{formatCurrency(totalAmountFiltered)}</p>
          </div>
           {paymentMethodFilter === 'All' && (
            <>
              <div>
                <p className="text-muted-foreground">Total Cash Received</p>
                <p className="font-semibold text-lg">{formatCurrency(totalCashAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Bank Received</p>
                <p className="font-semibold text-lg">{formatCurrency(totalBankAmount)}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Filtered Receipts</CardTitle>
          <CardDescription>Showing {filteredReceipts.length} of {allReceipts.length} total receipts based on active filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount (NGN)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                    <TableCell>{format(new Date(receipt.receiptDate), 'PP')}</TableCell>
                    <TableCell>{receipt.ledgerAccountName}</TableCell>
                    <TableCell>{receipt.paymentMethod}</TableCell>
                    <TableCell>{receipt.bankName || '-'}</TableCell>
                    <TableCell>{receipt.referenceNumber || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(receipt.amountReceived)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No receipts match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            End of list.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

