
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ReceiptForm from '../ReceiptForm';
import type { Receipt } from '@/types';
import { mockReceipts } from '@/lib/mockData';

export default function NewReceiptPage() {
  
  const handleSaveNewReceipt = (receipt: Receipt) => {
    // This is where you'd typically make an API call.
    // For mock data, we'll add to the array.
    // Note: This change is not persistent across page reloads for mock data.
    mockReceipts.push(receipt);
    console.log("New receipt added (mock):", receipt);
    // The ReceiptForm will handle toast and redirection.
  };

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
          Create New Receipt
        </h1>
      </header>
      
      <ReceiptForm onSave={handleSaveNewReceipt} />
    </div>
  );
}
