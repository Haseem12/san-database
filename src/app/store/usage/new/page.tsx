
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RecordUsageForm from '../RecordUsageForm';
import type { RawMaterialUsageLog } from '@/types';
import { mockRawMaterialUsageLogs } from '@/lib/mockData';

export default function NewMaterialUsagePage() {
  
  const handleSaveNewUsage = (usageLog: RawMaterialUsageLog) => {
    mockRawMaterialUsageLogs.push(usageLog);
    console.log("New material usage recorded (mock):", usageLog);
    // The RecordUsageForm will handle toast and redirection.
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 pb-4 mb-4 border-b">
        <Link href="/store/usage" passHref>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Usage Log</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Record New Material Usage
        </h1>
      </header>
      
      <RecordUsageForm onSave={handleSaveNewUsage} />
    </div>
  );
}
