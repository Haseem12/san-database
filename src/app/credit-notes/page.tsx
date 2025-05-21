
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Search, Eye, Edit, Trash2, FileText } from 'lucide-react';
import type { CreditNote } from '@/types';
import { mockCreditNotes } from '@/lib/mockData';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    setCreditNotes([...mockCreditNotes]); // Use a copy to allow local modifications like delete
  }, []);

  const filteredCreditNotes = useMemo(() =>
    creditNotes.filter(cn =>
      cn.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cn.ledgerAccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cn.reason.toLowerCase().includes(searchTerm.toLowerCase())
    ), [creditNotes, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleDeleteCreditNote = (creditNoteId: string) => {
    const creditNoteToDelete = creditNotes.find(cn => cn.id === creditNoteId);
    // Filter out from local state for UI update
    setCreditNotes(prevCreditNotes => prevCreditNotes.filter(cn => cn.id !== creditNoteId));
    // Also remove from the global mockCreditNotes array for mock persistence
    const indexInMock = mockCreditNotes.findIndex(cn => cn.id === creditNoteId);
    if (indexInMock > -1) {
      mockCreditNotes.splice(indexInMock, 1);
    }
    
    toast({
      title: "Credit Note Deleted (Mock)",
      description: `Credit Note "${creditNoteToDelete?.creditNoteNumber}" has been removed.`,
      variant: "destructive"
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold">Credit Notes</h1>
        <div className="flex items-center gap-2">
          {/* <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Export Credit Notes
          </Button> */}
          <Link href="/credit-notes/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Credit Note
            </Button>
          </Link>
        </div>
      </header>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Credit Note Management</CardTitle>
          <CardDescription>Track and manage all issued credit notes.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by number, account, or reason..."
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
                <TableHead>CN #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Ledger Account</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount (NGN)</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreditNotes.map((cn) => (
                <TableRow key={cn.id}>
                  <TableCell className="font-medium">{cn.creditNoteNumber}</TableCell>
                  <TableCell>{format(new Date(cn.creditNoteDate), 'PP')}</TableCell>
                  <TableCell>{cn.ledgerAccountName}</TableCell>
                  <TableCell>{cn.reason}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cn.amount)}</TableCell>
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
                        <Link href={`/credit-notes/${cn.id}`} passHref>
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                        </Link>
                        <Link href={`/credit-notes/${cn.id}/edit`} passHref>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit Credit Note</DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteCreditNote(cn.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Credit Note
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
            Showing <strong>{filteredCreditNotes.length}</strong> of <strong>{creditNotes.length}</strong> credit notes
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
