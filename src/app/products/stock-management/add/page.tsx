
"use client";

import React, { Suspense } from 'react'; // Removed useSearchParams
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import AddStockLogForm from '@/components/products/AddStockLogForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AddStockPageContent() {
  // Removed useSearchParams and related logic as the form now handles multiple products

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 pb-4 mb-4 border-b">
        <Link href="/products/stock-management" passHref>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Stock Management</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Add Stock to Inventory
        </h1>
      </header>
      <Card>
        <CardHeader>
            <CardTitle>Record Batch Stock Addition</CardTitle>
            <CardDescription>
                Log new stock received for one or more products.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <AddStockLogForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddStockPage() {
  // Suspense might still be useful if AddStockLogForm fetches products internally
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="h-8 w-8 animate-spin mr-2"/>Loading...</div>}>
      <AddStockPageContent />
    </Suspense>
  );
}
