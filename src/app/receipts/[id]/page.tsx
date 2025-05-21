
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Printer, Trash2, User, CalendarDays, Banknote, ClipboardList, Hash, Info, AlertCircle, Home } from 'lucide-react'; // Added Home for Bank
import type { Receipt } from '@/types';
import { mockReceipts, mockLedgerAccounts } from '@/lib/mockData';
import { getLedgerAccountOutstandingBalance } from '@/lib/ledgerUtils';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [outstandingBalance, setOutstandingBalance] = useState<number | null>(null);
  const [creditLimit, setCreditLimit] = useState<number | null>(null);

  const receiptId = params.id as string;

  useEffect(() => {
    if (receiptId) {
      let foundReceipt = mockReceipts.find(r => r.id === receiptId);
      if (foundReceipt) {
        if (!foundReceipt.ledgerAccountName) {
          const account = mockLedgerAccounts.find(acc => acc.id === foundReceipt.ledgerAccountId);
          foundReceipt = { ...foundReceipt, ledgerAccountName: account?.name || 'Unknown Account' };
        }
        const { balance, creditLimit: accCreditLimit } = getLedgerAccountOutstandingBalance(foundReceipt.ledgerAccountId);
        setOutstandingBalance(balance);
        setCreditLimit(accCreditLimit !== undefined ? accCreditLimit : null);
      }
      setReceipt(foundReceipt || null);
      setIsLoading(false);
    }
  }, [receiptId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleDelete = () => {
    // Mock delete
    const index = mockReceipts.findIndex(r => r.id === receiptId);
    if (index !== -1) {
      mockReceipts.splice(index, 1);
    }
    toast({
      title: "Receipt Deleted",
      description: `Receipt "${receipt?.receiptNumber}" has been removed.`,
    });
    router.push('/receipts');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Loading receipt details...</p></div>;
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4">Receipt not found.</p>
        <Link href="/receipts" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Receipts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/receipts" passHref>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Receipts</span>
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/receipts/${receipt.id}/edit`} passHref>
            <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
          </Link>
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete receipt &quot;{receipt.receiptNumber}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader className="bg-muted/50 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <CardTitle className="text-2xl font-bold mb-1">Receipt {receipt.receiptNumber}</CardTitle>
              <CardDescription>Payment received confirmation.</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground sm:text-right mt-2 sm:mt-0">
              <p>Recorded: {format(new Date(receipt.createdAt), 'PPP p')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={User} label="Received From" value={receipt.ledgerAccountName} />
            <InfoItem icon={CalendarDays} label="Receipt Date" value={format(new Date(receipt.receiptDate), 'PPP')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={Banknote} label="Amount Received" value={formatCurrency(receipt.amountReceived)} className="font-semibold text-lg text-green-600" />
            <InfoItem icon={ClipboardList} label="Payment Method" value={receipt.paymentMethod} />
          </div>
           {receipt.bankName && (
            <InfoItem icon={Home} label="Bank" value={receipt.bankName} fullWidth />
          )}
          {receipt.referenceNumber && (
            <InfoItem icon={Hash} label="Reference #" value={receipt.referenceNumber} fullWidth />
          )}
           {outstandingBalance !== null && (
            <InfoItem 
              icon={AlertCircle} 
              label="Customer Outstanding Balance" 
              value={formatCurrency(outstandingBalance)} 
              className={outstandingBalance > 0 ? "text-destructive font-semibold" : "text-green-600 font-semibold"}
              fullWidth 
            />
          )}
          {creditLimit !== null && (
             <InfoItem 
              icon={Banknote} 
              label="Customer Credit Limit" 
              value={formatCurrency(creditLimit)} 
              className="font-medium"
              fullWidth 
            />
          )}
          {receipt.notes && (
            <InfoItem icon={Info} label="Notes for this Receipt" value={receipt.notes} fullWidth isTextarea />
          )}
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 text-center text-xs text-muted-foreground">
          <p>Thank you for your payment. This receipt confirms the amount received.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  className?: string;
  fullWidth?: boolean;
  isTextarea?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, className, fullWidth, isTextarea }) => (
  <div className={`flex items-start gap-3 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <Icon className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
    <div>
      <p className="font-medium">{label}</p>
      {isTextarea ? (
        <p className={cn("text-muted-foreground whitespace-pre-wrap", className)}>{value}</p>
      ) : (
        <p className={cn("text-muted-foreground", className)}>{value}</p>
      )}
    </div>
  </div>
);

