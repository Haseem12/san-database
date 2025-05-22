
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SaleForm from '../SaleForm'; 
import type { Sale } from '@/types';
// mockSales import is no longer needed here as saving is handled in SaleForm with mock data

export default function NewSalePage() {
  
  const handleSaveNewSale = (sale: Sale, invoiceId: string) => {
    // The actual saving to mock data arrays is now handled within SaleForm.
    // This function is called by SaleForm's onSave prop after successful save to mock data.
    console.log("New sale recorded (mock):", sale);
    console.log("Associated Invoice ID (mock):", invoiceId);
    // Redirection is also handled in SaleForm.
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 pb-4 mb-4 border-b">
        <Link href="/sales" passHref>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Sales</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Record New Sale
        </h1>
      </header>
      
      <SaleForm onSave={handleSaveNewSale} />
    </div>
  );
}

