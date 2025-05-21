
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Receipt, LedgerAccount, ReceiptPaymentMethod, BankName } from '@/types';
import { receiptPaymentMethods, bankNames } from '@/types';
import { mockLedgerAccounts, mockReceipts } from '@/lib/mockData';
import { DatePickerComponent } from "@/components/ui/date-picker"; // Use shared DatePicker
import { getLedgerAccountOutstandingBalance } from '@/lib/ledgerUtils';
import { format } from 'date-fns';

interface ReceiptFormProps {
  receipt?: Receipt; // For editing existing receipt
  onSave: (receipt: Receipt) => void;
}

export default function ReceiptForm({ receipt: existingReceipt, onSave }: ReceiptFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [receiptNumber, setReceiptNumber] = useState(
    existingReceipt?.receiptNumber || `RCPT-${new Date().getFullYear()}-${String(mockReceipts.length + 1).padStart(4, '0')}`
  );
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string | undefined>(existingReceipt?.ledgerAccountId);
  const [receiptDate, setReceiptDate] = useState<Date | undefined>(
    existingReceipt ? new Date(existingReceipt.receiptDate) : new Date()
  );
  const [amountReceived, setAmountReceived] = useState<number>(existingReceipt?.amountReceived || 0);
  const [paymentMethod, setPaymentMethod] = useState<ReceiptPaymentMethod | undefined>(
    existingReceipt?.paymentMethod || receiptPaymentMethods[0]
  );
  const [selectedBankName, setSelectedBankName] = useState<BankName | undefined>(existingReceipt?.bankName);
  const [referenceNumber, setReferenceNumber] = useState(existingReceipt?.referenceNumber || '');
  const [notes, setNotes] = useState(existingReceipt?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [outstandingBalance, setOutstandingBalance] = useState<number | null>(null);
  const [creditLimit, setCreditLimit] = useState<number | null>(null);
  const [selectedAccountName, setSelectedAccountName] = useState<string | null>(null);


  useEffect(() => {
    if (selectedLedgerAccountId) {
      const { balance, accountName, creditLimit: accCreditLimit } = getLedgerAccountOutstandingBalance(selectedLedgerAccountId);
      setOutstandingBalance(balance);
      setSelectedAccountName(accountName || null);
      setCreditLimit(accCreditLimit !== undefined ? accCreditLimit : null);
    } else {
      setOutstandingBalance(null);
      setSelectedAccountName(null);
      setCreditLimit(null);
    }
  }, [selectedLedgerAccountId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const selectedAccount = mockLedgerAccounts.find(acc => acc.id === selectedLedgerAccountId);

    if (!selectedLedgerAccountId || !selectedAccount) {
      toast({ title: "Error", description: "Please select a valid ledger account.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!receiptDate) {
      toast({ title: "Error", description: "Please select a receipt date.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (amountReceived <= 0) {
      toast({ title: "Error", description: "Amount received must be greater than zero.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Error", description: "Please select a payment method.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    // Bank name is optional, so no validation needed here unless specified otherwise

    const newOrUpdatedReceipt: Receipt = {
      id: existingReceipt?.id || `rcpt_${Date.now()}`,
      receiptNumber,
      receiptDate,
      ledgerAccountId: selectedLedgerAccountId,
      ledgerAccountName: selectedAccount.name,
      amountReceived,
      paymentMethod,
      bankName: selectedBankName,
      referenceNumber,
      notes,
      createdAt: existingReceipt?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(newOrUpdatedReceipt);

    toast({
      title: existingReceipt ? "Receipt Updated" : "Receipt Created",
      description: `Receipt "${newOrUpdatedReceipt.receiptNumber}" for ${newOrUpdatedReceipt.ledgerAccountName} has been successfully ${existingReceipt ? 'updated' : 'created'}. Ledger credited.`,
    });
    router.push('/receipts');
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{existingReceipt ? 'Edit Receipt' : 'Create New Receipt'}</CardTitle>
          <CardDescription>
            {existingReceipt ? `Editing receipt ${existingReceipt.receiptNumber}` : 'Record a new payment received.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ledgerAccount">Ledger Account (Customer/Debtor) <span className="text-destructive">*</span></Label>
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
                  {creditLimit !== null && <p>Credit Limit: <span className="font-medium text-foreground">{formatCurrency(creditLimit)}</span></p>}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input id="receiptNumber" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receiptDate">Receipt Date <span className="text-destructive">*</span></Label>
              <DatePickerComponent date={receiptDate} setDate={setReceiptDate} />
            </div>
            <div>
              <Label htmlFor="amountReceived">Amount Received (NGN) <span className="text-destructive">*</span></Label>
              <Input
                id="amountReceived"
                type="number"
                value={amountReceived}
                onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)}
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value: ReceiptPaymentMethod) => setPaymentMethod(value)} value={paymentMethod} required>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {receiptPaymentMethods.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bankName">Bank (Optional)</Label>
              <Select onValueChange={(value: BankName) => setSelectedBankName(value)} value={selectedBankName}>
                <SelectTrigger id="bankName">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {bankNames.map(bank => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
            <Input
              id="referenceNumber"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder="e.g., Cheque no., Transfer ID"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details about the payment..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !selectedLedgerAccountId || !receiptDate || amountReceived <= 0 || !paymentMethod}>
          {isLoading ? (existingReceipt ? 'Updating...' : 'Saving...') : (existingReceipt ? 'Save Changes' : 'Save Receipt')}
        </Button>
      </div>
    </form>
  );
}

