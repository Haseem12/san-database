
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CreditNoteForm from '../../CreditNoteForm';
import type { CreditNote } from '@/types';
import { mockCreditNotes, mockLedgerAccounts } from '@/lib/mockData';

export default function EditCreditNotePage() {
  const params = useParams();
  const router = useRouter();
  const creditNoteId = params.id as string;
  const [creditNote, setCreditNote] = useState<CreditNote | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (creditNoteId) {
      // Simulate fetching credit note data
      let foundCreditNote = mockCreditNotes.find(cn => cn.id === creditNoteId);
      if (foundCreditNote) {
        if (!foundCreditNote.ledgerAccountName) {
            const account = mockLedgerAccounts.find(acc => acc.id === foundCreditNote.ledgerAccountId);
            foundCreditNote = { ...foundCreditNote, ledgerAccountName: account?.name || 'Unknown Account' };
        }
        // Ensure items are correctly passed if the reason is "Returned Goods"
        if (foundCreditNote.reason === 'Returned Goods' && !foundCreditNote.items) {
            // This case might happen if mock data was manually edited or old data exists.
            // For robustness, initialize items to an empty array if they are expected but missing.
            // Or, ensure your mockData generation always includes items for this reason.
            // For now, we assume `CreditNoteForm` handles initializing items if not provided.
            // console.warn("Credit note with 'Returned Goods' reason is missing items. Form might initialize them.");
        }
      }
      setCreditNote(foundCreditNote);
      setIsLoading(false);
    }
  }, [creditNoteId]);

  const handleSaveChanges = (updatedCreditNote: CreditNote) => {
    // For mock data, update the item in the array.
    const index = mockCreditNotes.findIndex(cn => cn.id === updatedCreditNote.id);
    if (index !== -1) {
      mockCreditNotes[index] = updatedCreditNote;

      // If items were returned, update product stock (this logic is also in CreditNoteForm, ensure consistency or centralize)
      if (updatedCreditNote.reason === 'Returned Goods' && updatedCreditNote.items) {
        updatedCreditNote.items.forEach(returnedItem => {
          const productIndex = mockProducts.findIndex(p => p.id === returnedItem.productId);
          if (productIndex !== -1) {
            // Note: if editing, this logic needs to be smarter:
            // it should adjust based on the *difference* from the original returned items
            // For simplicity in mock, we assume the form's onSave always reflects the final state
            // and the stock adjustment there is sufficient or it's handled by re-adding.
            // A more robust solution would track original items vs new items.
            // For this example, we rely on the form logic to handle stock for new/updated values correctly.
            // console.log(`Stock for ${mockProducts[productIndex].name} would be adjusted here if needed during edit save.`);
          }
        });
      }
    }
    console.log("Credit Note updated (mock):", updatedCreditNote);
    // The CreditNoteForm will handle toast and redirection.
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Loading credit note details...</p></div>;
  }

  if (!creditNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4">Credit Note not found.</p>
        <Link href="/credit-notes" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Credit Notes
          </Button>
        </Link>
      </div>
    );
  }

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
          Edit Credit Note: {creditNote.creditNoteNumber}
        </h1>
      </header>
      
      <CreditNoteForm creditNote={creditNote} onSave={handleSaveChanges} />
    </div>
  );
}
