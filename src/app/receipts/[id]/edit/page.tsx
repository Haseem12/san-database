
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ReceiptForm from '../../ReceiptForm';
import type { Receipt } from '@/types';
import { mockReceipts, mockLedgerAccounts } from '@/lib/mockData';

export default function EditReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = params.id as string;
  const [receipt, setReceipt] = useState<Receipt | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (receiptId) {
      // Simulate fetching receipt data
      const foundReceipt = mockReceipts.find(r => r.id === receiptId);
      if (foundReceipt && !foundReceipt.ledgerAccountName) {
        const account = mockLedgerAccounts.find(acc => acc.id === foundReceipt.ledgerAccountId);
        setReceipt({ ...foundReceipt, ledgerAccountName: account?.name || 'Unknown Account' });
      } else {
        setReceipt(foundReceipt);
      }
      setIsLoading(false);
    }
  }, [receiptId]);

  const handleSaveChanges = (updatedReceipt: Receipt) => {
    // This is where you'd typically make an API call.
    // For mock data, we'll update the item in the array.
    const index = mockReceipts.findIndex(r => r.id === updatedReceipt.id);
    if (index !== -1) {
      mockReceipts[index] = updatedReceipt;
    }
    console.log("Receipt updated (mock):", updatedReceipt);
    // The ReceiptForm will handle toast and redirection.
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Loading receipt details...</p></div>;
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4">Receipt not found.</p>
        <Link href="/receipts" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Receipts
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 pb-4 mb-4 border-b">
        <Link href="/receipts" passHref>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Receipts</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Edit Receipt: {receipt.receiptNumber}
        </h1>
      </header>
      
      <ReceiptForm receipt={receipt} onSave={handleSaveChanges} />
    </div>
  );
}
