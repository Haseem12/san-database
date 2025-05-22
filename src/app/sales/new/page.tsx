
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '../../product/ProductForm';
import type { Product } from '@/types';

export default function NewProductPage() {
  
  const handleSaveNewProduct = (product: Product) => {
    // This is where you'd typically make an API call.
    // For mock data, we'll add to the array.
    mockProducts.push(product);
    console.log("New product added (mock):", product);
    // The ProductForm will handle toast and redirection.
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 pb-4 mb-4 border-b">
        <Link href="/products" passHref>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Products</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Add New Finished Product
        </h1>
      </header>
      
      <ProductForm onSave={handleSaveNewProduct} />
    </div>
  );
}
