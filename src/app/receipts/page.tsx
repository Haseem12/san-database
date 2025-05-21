
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Search, Eye, Edit, Trash2, FileDown } from 'lucide-react';
import type { Receipt } from '@/types';
import { mockReceipts, mockLedgerAccounts } from '@/lib/mockData'; // Ensure mockLedgerAccounts is imported if needed for names
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data, ensure ledgerAccountName is populated
    const populatedReceipts = mockReceipts.map(receipt => {
      if (!receipt.ledgerAccountName) {
        const account = mockLedgerAccounts.find(acc => acc.id === receipt.ledgerAccountId);
        return { ...receipt, ledgerAccountName: account?.name || 'Unknown Account' };
      }
      return receipt;
    });
    setReceipts(populatedReceipts);
  }, []);

  const filteredReceipts = useMemo(() =>
    receipts.filter(receipt =>
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.ledgerAccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    ), [receipts, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleDeleteReceipt = (receiptId: string) => {
    // Placeholder for delete functionality
    const receiptToDelete = receipts.find(r => r.id === receiptId);
    // In a real app, you would call an API. Here, we filter the local state.
    // Note: This change is not persistent for mock data.
    setReceipts(prevReceipts => prevReceipts.filter(r => r.id !== receiptId));
    toast({
      title: "Receipt Deleted",
      description: `Receipt "${receiptToDelete?.receiptNumber}" has been removed (mock).`,
      variant: "destructive"
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold">Receipts</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Receipts
          </Button>
          <Link href="/receipts/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Receipt
            </Button>
          </Link>
        </div>
      </header>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Receipt Management</CardTitle>
          <CardDescription>Track and manage all customer payment receipts.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search receipts by number, customer, or payment method..."
              className="pl-8 w-full md:w-1/2"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount (NGN)</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                  <TableCell>{format(new Date(receipt.receiptDate), 'PP')}</TableCell>
                  <TableCell>{receipt.ledgerAccountName}</TableCell>
                  <TableCell>{receipt.paymentMethod}</TableCell>
                  <TableCell className="text-right">{formatCurrency(receipt.amountReceived)}</TableCell>
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
                        <Link href={`/receipts/${receipt.id}`} passHref>
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Receipt</DropdownMenuItem>
                        </Link>
                        <Link href={`/receipts/${receipt.id}/edit`} passHref>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit Receipt</DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteReceipt(receipt.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Receipt
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredReceipts.length}</strong> of <strong>{receipts.length}</strong> receipts
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
