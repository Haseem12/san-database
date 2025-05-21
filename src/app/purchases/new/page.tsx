
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PurchaseOrderForm from '../PurchaseOrderForm';
import type { PurchaseOrder } from '@/types';
import { mockPurchaseOrders } from '@/lib/mockData';

export default function NewPurchaseOrderPage() {
  
  const handleSaveNewPurchaseOrder = (po: PurchaseOrder) => {
    mockPurchaseOrders.push(po);
    console.log("New purchase order added (mock):", po);
    // The PurchaseOrderForm will handle toast and redirection.
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 pb-4 mb-4 border-b">
        <Link href="/purchases" passHref>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Purchase Orders</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Create New Purchase Order
        </h1>
      </header>
      
      <PurchaseOrderForm onSave={handleSaveNewPurchaseOrder} />
    </div>
  );
}
