"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter from next/navigation
import ProductForm from './new/ProductForm'; // Import ProductForm correctly
import { Product } from '@/types'; // Ensure this matches your type definition

export default function NewProductPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialize useRouter

  const handleSaveNewProduct = (product: Product) => {
    // Logic to handle the new product (could be state update or other actions)
    console.log("New product added:", product);

    // After adding the product, redirect to the products page
    router.push('/products'); // Redirect to /products page
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

      {error && <div className="text-red-500">{error}</div>} {/* Display error if any */}

      {/* Pass handleSaveNewProduct to ProductForm */}
      <ProductForm onSave={handleSaveNewProduct} isLoading={isLoading} />
    </div>
  );
}
