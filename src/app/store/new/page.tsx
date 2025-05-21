
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RawMaterialForm from '../RawMaterialForm';
import type { RawMaterial } from '@/types';
import { mockRawMaterials } from '@/lib/mockData'; 

export default function NewRawMaterialPage() {
  
  const handleSaveNewRawMaterial = (material: RawMaterial) => {
    // This is where you'd typically make an API call.
    // For mock data, we'll add to the array.
    mockRawMaterials.push(material);
    console.log("New raw material added (mock):", material);
    // The RawMaterialForm will handle toast and redirection.
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 pb-4 mb-4 border-b">
        <Link href="/inventory" passHref>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Inventory</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Add New Item to Inventory
        </h1>
      </header>
      
      <RawMaterialForm onSave={handleSaveNewRawMaterial} />
    </div>
  );
}
