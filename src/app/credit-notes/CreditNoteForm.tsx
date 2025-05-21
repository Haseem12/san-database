
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { CreditNote, LedgerAccount, CreditNoteReason, SaleItem, Product, UnitOfMeasure } from '@/types';
import { creditNoteReasons } from '@/types';
import { mockLedgerAccounts, mockCreditNotes, mockProducts, getProductPriceForCustomer } from '@/lib/mockData';
import { DatePickerComponent } from "@/components/ui/date-picker";
import { getLedgerAccountOutstandingBalance } from '@/lib/ledgerUtils';
import { format } from 'date-fns';
import { PlusCircle, Trash2 } from 'lucide-react';

interface CreditNoteFormProps {
  creditNote?: CreditNote;
  onSave: (creditNote: CreditNote) => void;
}

const newEmptyReturnedItem = (): Omit<SaleItem, 'productName' | 'unitPrice' | 'totalPrice'> & { productId: string } => ({
  productId: '',
  quantity: 1,
});

export default function CreditNoteForm({ creditNote: existingCreditNote, onSave }: CreditNoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [creditNoteNumber, setCreditNoteNumber] = useState(
    existingCreditNote?.creditNoteNumber || `CN-${new Date().getFullYear()}-${String(mockCreditNotes.length + 1).padStart(4, '0')}`
  );
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string | undefined>(existingCreditNote?.ledgerAccountId);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<LedgerAccount | null>(null);
  const [creditNoteDate, setCreditNoteDate] = useState<Date | undefined>(
    existingCreditNote ? new Date(existingCreditNote.creditNoteDate) : new Date()
  );
  const [amount, setAmount] = useState<number>(existingCreditNote?.amount || 0);
  const [reason, setReason] = useState<CreditNoteReason | undefined>(
    existingCreditNote?.reason || creditNoteReasons[0]
  );
  const [description, setDescription] = useState(existingCreditNote?.description || '');
  const [relatedInvoiceId, setRelatedInvoiceId] = useState(existingCreditNote?.relatedInvoiceId || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const [outstandingBalance, setOutstandingBalance] = useState<number | null>(null);
  const [selectedAccountName, setSelectedAccountName] = useState<string | null>(null);

  const [returnedItems, setReturnedItems] = useState<Array<Partial<SaleItem> & { productId: string }>>(
    existingCreditNote?.reason === 'Returned Goods' && existingCreditNote.items 
    ? existingCreditNote.items.map(item => ({ ...item, productId: item.productId })) 
    : [newEmptyReturnedItem()]
  );

  useEffect(() => {
    if (selectedLedgerAccountId) {
      const account = mockLedgerAccounts.find(acc => acc.id === selectedLedgerAccountId);
      setSelectedLedgerAccount(account || null);
      const fetchBalance = async () => {
        const { balance, accountName } = await getLedgerAccountOutstandingBalance(selectedLedgerAccountId);
        setOutstandingBalance(balance);
        setSelectedAccountName(accountName || null);
      };
      fetchBalance();
    } else {
      setSelectedLedgerAccount(null);
      setOutstandingBalance(null);
      setSelectedAccountName(null);
    }
  }, [selectedLedgerAccountId]);

  useEffect(() => {
    if (reason === 'Returned Goods' && selectedLedgerAccount) {
      const calculatedAmount = returnedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      setAmount(calculatedAmount);
    }
  }, [reason, returnedItems, selectedLedgerAccount]);


  const handleReasonChange = (newReason: CreditNoteReason) => {
    setReason(newReason);
    if (newReason !== 'Returned Goods') {
      setReturnedItems([newEmptyReturnedItem()]); // Reset items if not returned goods
      if (existingCreditNote && existingCreditNote.reason !== newReason) {
        setAmount(0); // Reset amount if reason changes from returned goods and it's not the initial load
      } else if (!existingCreditNote) {
        setAmount(0); // Reset amount for new notes if reason is not returned goods
      }
    } else {
       // If switching to 'Returned Goods', recalculate amount based on current items (might be empty)
      const calculatedAmount = returnedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      setAmount(calculatedAmount);
    }
  };

  const handleItemChange = (index: number, field: keyof SaleItem | 'productId', value: string | number) => {
    const updatedItems = [...returnedItems];
    const currentItem = { ...updatedItems[index] };

    if (field === 'productId') {
      currentItem.productId = value as string;
      const product = mockProducts.find(p => p.id === currentItem.productId);
      if (product && selectedLedgerAccount) {
        currentItem.productName = product.name;
        currentItem.unitOfMeasure = product.unitOfMeasure;
        currentItem.unitPrice = getProductPriceForCustomer(product, selectedLedgerAccount.priceLevel);
      } else {
        currentItem.productName = '';
        currentItem.unitPrice = 0;
        currentItem.unitOfMeasure = undefined;
      }
    } else if (field === 'quantity') {
      currentItem.quantity = Number(value) || 0;
    }
    
    currentItem.totalPrice = (currentItem.unitPrice || 0) * (currentItem.quantity || 0);
    updatedItems[index] = currentItem;
    setReturnedItems(updatedItems);
  };

  const addItem = () => {
    setReturnedItems([...returnedItems, newEmptyReturnedItem()]);
  };

  const removeItem = (index: number) => {
    const updatedItems = returnedItems.filter((_, i) => i !== index);
    setReturnedItems(updatedItems.length > 0 ? updatedItems : [newEmptyReturnedItem()]);
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!selectedLedgerAccountId || !selectedLedgerAccount) {
      toast({ title: "Error", description: "Please select a valid ledger account.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!creditNoteDate) {
      toast({ title: "Error", description: "Please select a credit note date.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!reason) {
      toast({ title: "Error", description: "Please select a reason for the credit note.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    let finalItemsForSave: SaleItem[] | undefined = undefined;
    let calculatedAmount = amount;

    if (reason === 'Returned Goods') {
      if (returnedItems.some(item => !item.productId || !item.quantity || item.quantity <= 0 || item.unitPrice === undefined)) {
        toast({ title: "Error", description: "Please ensure all returned items have a product, quantity, and valid price.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      finalItemsForSave = returnedItems.map(item => {
        const product = mockProducts.find(p => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found during save.`); // Should not happen if form validation is correct
        // Update stock in mockData
        const productIndex = mockProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          mockProducts[productIndex].stock += item.quantity || 0;
          mockProducts[productIndex].updatedAt = new Date();
        }
        return {
          productId: item.productId!,
          productName: product.name,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          totalPrice: item.totalPrice!,
          unitOfMeasure: product.unitOfMeasure,
        };
      });
      calculatedAmount = finalItemsForSave.reduce((sum, item) => sum + item.totalPrice, 0);
    } else {
      if (amount <= 0) {
        toast({ title: "Error", description: "Amount must be greater than zero.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    }


    const newOrUpdatedCreditNote: CreditNote = {
      id: existingCreditNote?.id || `cn_${Date.now()}`,
      creditNoteNumber,
      creditNoteDate,
      ledgerAccountId: selectedLedgerAccountId,
      ledgerAccountName: selectedLedgerAccount.name,
      amount: calculatedAmount,
      reason,
      description,
      relatedInvoiceId: relatedInvoiceId || undefined,
      items: reason === 'Returned Goods' ? finalItemsForSave : undefined,
      createdAt: existingCreditNote?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(newOrUpdatedCreditNote);

    toast({
      title: existingCreditNote ? "Credit Note Updated" : "Credit Note Created",
      description: `Credit Note "${newOrUpdatedCreditNote.creditNoteNumber}" for ${newOrUpdatedCreditNote.ledgerAccountName} has been successfully ${existingCreditNote ? 'updated' : 'created'}.`,
    });
    router.push('/credit-notes');
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{existingCreditNote ? 'Edit Credit Note' : 'Create New Credit Note'}</CardTitle>
          <CardDescription>
            {existingCreditNote ? `Editing credit note ${existingCreditNote.creditNoteNumber}` : 'Issue a new credit note to a ledger account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ledgerAccount">Ledger Account <span className="text-destructive">*</span></Label>
              <Select onValueChange={setSelectedLedgerAccountId} value={selectedLedgerAccountId} required>
                <SelectTrigger id="ledgerAccount">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {mockLedgerAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAccountName && outstandingBalance !== null && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Account: <span className="font-medium text-foreground">{selectedAccountName}</span></p>
                  <p>Current Outstanding: <span className={`font-medium ${outstandingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(outstandingBalance)}</span></p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="creditNoteNumber">Credit Note Number</Label>
              <Input id="creditNoteNumber" value={creditNoteNumber} onChange={e => setCreditNoteNumber(e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="creditNoteDate">Credit Note Date <span className="text-destructive">*</span></Label>
              <DatePickerComponent date={creditNoteDate} setDate={setCreditNoteDate} />
            </div>
            <div>
              <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
              <Select onValueChange={handleReasonChange} value={reason} required>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {creditNoteReasons.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {reason === 'Returned Goods' && (
            <Card>
              <CardHeader>
                <CardTitle>Returned Items</CardTitle>
                <CardDescription>Specify the products and quantities being returned. Prices are based on the selected ledger account's price level.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => handleItemChange(index, 'productId', value)}
                            disabled={!selectedLedgerAccount}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockProducts.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} ({p.unitOfMeasure}{p.unitOfMeasure === 'Litres' && p.litres ? ` - ${p.litres}L` : ''})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!selectedLedgerAccount && index === 0 && <p className="text-xs text-destructive mt-1">Select a ledger account first.</p>}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            min="1"
                            disabled={!item.productId}
                          />
                        </TableCell>
                        <TableCell>{item.unitOfMeasure || 'N/A'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.totalPrice || 0)}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={returnedItems.length === 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-4" disabled={!selectedLedgerAccount}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </CardContent>
              <CardFooter>
                <div className="text-right w-full font-semibold">
                    Total Return Value: {formatCurrency(amount)}
                </div>
              </CardFooter>
            </Card>
          )}

          <div>
            <Label htmlFor="amount">Amount (NGN) <span className="text-destructive">*</span></Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              min="0.01"
              step="0.01"
              required
              readOnly={reason === 'Returned Goods'}
              className={reason === 'Returned Goods' ? 'bg-muted/50' : ''}
            />
          </div>
          
          <div>
            <Label htmlFor="relatedInvoiceId">Related Invoice ID (Optional)</Label>
            <Input
              id="relatedInvoiceId"
              value={relatedInvoiceId}
              onChange={e => setRelatedInvoiceId(e.target.value)}
              placeholder="e.g., INV-2024-001"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description / Further Notes (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed reason or notes for the credit note..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={
            isLoading || 
            !selectedLedgerAccountId || 
            !creditNoteDate || 
            (!amount && reason !== 'Returned Goods') || // Amount must be >0 if not returned goods
            (reason === 'Returned Goods' && (!returnedItems.length || returnedItems.some(item => !item.productId || !item.quantity || item.quantity <=0))) || // If returned goods, items must be valid
            !reason
          }
        >
          {isLoading ? (existingCreditNote ? 'Updating...' : 'Saving...') : (existingCreditNote ? 'Save Changes' : 'Save Credit Note')}
        </Button>
      </div>
    </form>
  );
}
