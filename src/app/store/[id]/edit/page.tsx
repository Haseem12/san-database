
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RawMaterialForm from '../../RawMaterialForm'; // Adjusted import path
import type { RawMaterial } from '@/types';
import { mockRawMaterials } from '@/lib/mockData'; 

export default function EditRawMaterialPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params.id as string;
  const [rawMaterial, setRawMaterial] = useState<RawMaterial | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (materialId) {
      // Simulate fetching raw material data
      const foundMaterial = mockRawMaterials.find(material => material.id === materialId);
      setRawMaterial(foundMaterial);
      setIsLoading(false);
    }
  }, [materialId]);

  const handleSaveChanges = (updatedMaterial: RawMaterial) => {
    // This is where you'd typically make an API call.
    // For mock data, we'll update the item in the array.
    const index = mockRawMaterials.findIndex(material => material.id === updatedMaterial.id);
    if (index !== -1) {
      mockRawMaterials[index] = updatedMaterial;
    }
    console.log("Raw material updated (mock):", updatedMaterial);
    // The RawMaterialForm will handle toast and redirection.
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Loading item details...</p></div>;
  }

  if (!rawMaterial) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4">Raw Material not found.</p>
        <Link href="/inventory" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Inventory
          </Button>
        </Link>
      </div>
    );
  }

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
          Edit Inventory Item: {rawMaterial.name}
        </h1>
      </header>
      
      <RawMaterialForm rawMaterial={rawMaterial} onSave={handleSaveChanges} />
    </div>
  );
}
