
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CreditNoteForm from '../CreditNoteForm';
import type { CreditNote } from '@/types';
import { mockCreditNotes, mockProducts } from '@/lib/mockData';

export default function NewCreditNotePage() {
  
  const handleSaveNewCreditNote = (creditNote: CreditNote) => {
    // Add to the mockCreditNotes array.
    mockCreditNotes.push(creditNote);

    // Stock update logic for 'Returned Goods' is now handled within CreditNoteForm's handleSubmit.
    // So, no need to duplicate it here.
    
    console.log("New credit note added (mock):", creditNote);
    // The CreditNoteForm will handle toast and redirection.
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 pb-4 mb-4 border-b">
        <Link href="/credit-notes" passHref>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Credit Notes</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Create New Credit Note
        </h1>
      </header>
      
      <CreditNoteForm onSave={handleSaveNewCreditNote} />
    </div>
  );
}
