
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PurchaseOrderForm from '../../PurchaseOrderForm';
import type { PurchaseOrder } from '@/types';
import { mockPurchaseOrders } from '@/lib/mockData';

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (poId) {
      const foundPO = mockPurchaseOrders.find(p => p.id === poId);
      setPurchaseOrder(foundPO);
      setIsLoading(false);
    }
  }, [poId]);

  const handleSaveChanges = (updatedPO: PurchaseOrder) => {
    const index = mockPurchaseOrders.findIndex(p => p.id === updatedPO.id);
    if (index !== -1) {
      mockPurchaseOrders[index] = updatedPO;
    }
    console.log("Purchase Order updated (mock):", updatedPO);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Loading purchase order details...</p></div>;
  }

  if (!purchaseOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4">Purchase Order not found.</p>
        <Link href="/purchases" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Purchase Orders
          </Button>
        </Link>
      </div>
    );
  }

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
          Edit Purchase Order: {purchaseOrder.poNumber}
        </h1>
      </header>
      
      <PurchaseOrderForm purchaseOrder={purchaseOrder} onSave={handleSaveChanges} />
    </div>
  );
}
