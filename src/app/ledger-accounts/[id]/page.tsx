
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Phone, MapPin, CalendarDays, Banknote, Clock, FileText as FileTextIcon, Tag, Eye, AlertCircle, TrendingUp, TrendingDown, NotebookPen, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { LedgerAccount as LedgerAccountTypeFromTypes } from '@/types'; // Renamed to avoid conflict

interface AccountActivity {
  id: string;
  date: Date;
  type: 'Invoice' | 'Receipt' | 'Credit Note';
  documentNumber: string;
  description: string;
  amount: number;
  status?: string;
  detailsLink: string;
}

// Use the imported LedgerAccount type
interface LedgerAccount extends LedgerAccountTypeFromTypes {}

export default function LedgerAccountDetailPage() {
  const params = useParams();
  const accountId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [account, setAccount] = useState<LedgerAccount | null>(null);
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [totalInvoiced, setTotalInvoiced] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [totalCredited, setTotalCredited] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (!accountId) {
        setError("Account ID is missing.");
        setLoading(false);
        return;
    }
    async function loadAccountDetails() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://sajfoods.net/busa-api/database/get_ledger_account_detail.php?id=${accountId}`);
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to fetch account details: ${res.status} ${errorText}`);
        }
        const json = await res.json();
        
        if (json.success && json.account) {
          setAccount(json.account);
          setTotalInvoiced(parseFloat(json.totalInvoiced) || 0);
          setTotalReceived(parseFloat(json.totalReceived) || 0);
          setTotalCredited(parseFloat(json.totalCredited) || 0);
          setOutstandingBalance(parseFloat(json.outstandingBalance) || 0);

          const mappedInvoices: AccountActivity[] = (json.invoices || []).map((inv: any) => ({
            id: inv.id,
            date: new Date(inv.issueDate || inv.date), // Use issueDate for invoices
            type: 'Invoice' as const,
            documentNumber: inv.invoiceNumber,
            description: `Invoice to ${inv.customerName || json.account.name}`,
            amount: parseFloat(inv.totalAmount) || 0,
            status: inv.status,
            detailsLink: `/invoices/${inv.id}`
          }));
          const mappedReceipts: AccountActivity[] = (json.receipts || []).map((r: any) => ({
            id: r.id,
            date: new Date(r.receiptDate || r.date), // Use receiptDate
            type: 'Receipt' as const,
            documentNumber: r.receiptNumber,
            description: `Payment via ${r.paymentMethod || 'Unknown'}`,
            amount: parseFloat(r.amountReceived) || 0, // This is a positive value (money in)
            detailsLink: `/receipts/${r.id}`
          }));
          const mappedCreditNotes: AccountActivity[] = (json.creditNotes || []).map((cn: any) => ({
            id: cn.id,
            date: new Date(cn.creditNoteDate || cn.date), // Use creditNoteDate
            type: 'Credit Note' as const,
            documentNumber: cn.creditNoteNumber,
            description: `${cn.reason || 'Credit'}: ${cn.description || ''}`,
            amount: parseFloat(cn.amount) || 0, // This is a value that reduces outstanding balance
            detailsLink: `/credit-notes/${cn.id}`
          }));
          setActivities([...mappedInvoices, ...mappedReceipts, ...mappedCreditNotes].sort((a,b) => b.date.getTime() - a.date.getTime()));
        } else {
          throw new Error(json.message || 'Failed to load account data.');
        }
      } catch (err: any) {
        console.error("Error loading account details:", err);
        setError(err.message);
        toast({ title: "Error", description: `Could not load account details: ${err.message}`, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadAccountDetails();
  }, [accountId, toast]);

  const formatCurrency = (amt: number | undefined | null) => {
    if (amt === undefined || amt === null) return 'N/A';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amt);
  }

  const creditStatus = useMemo(() => {
    if (!account || account.creditLimit === undefined || account.creditLimit === null || account.creditLimit === 0) {
      return { color: '', msg: 'No credit limit set or N/A.' };
    }
    const limit = account.creditLimit;
    const usagePercentage = (outstandingBalance / limit) * 100;

    if (outstandingBalance >= limit) return { color: 'text-destructive font-semibold', msg: 'Credit limit reached/exceeded!' };
    if (usagePercentage >= 80) return { color: 'text-orange-500 font-medium', msg: 'Nearing credit limit.' };
    return { color: outstandingBalance > 0 ? 'text-amber-600' : 'text-green-600', msg: 'Within credit limit.' };
  }, [account, outstandingBalance]);

  const handleDelete = async () => {
    if (!account) return;
    try {
      const response = await fetch('https://sajfoods.net/busa-api/database/delete_ledger_account.php', { // Ensure this PHP script exists
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Account Deleted",
          description: `Ledger account "${account.name}" has been removed.`,
        });
        router.push('/ledger-accounts');
      } else {
        throw new Error(result.message || "Failed to delete account from server.");
      }
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
      console.error("Error deleting ledger account:", error);
    }
  };


  if (loading) return <div className="flex justify-center items-center h-full"><p>Loading account details...</p></div>;
  if (error) return <div className="flex justify-center items-center h-full text-destructive"><p>Error: {error}</p></div>;
  if (!account) return <div className="flex justify-center items-center h-full"><p>Ledger account not found.</p></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/ledger-accounts">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Accounts</Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/ledger-accounts/${account.id}/edit`}>
            <Button variant="outline"><Edit className="mr-2 h-4 w-4" />Edit Account</Button>
          </Link>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete ledger account &quot;{account.name}&quot;.
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
      
      <Card>
        <CardHeader className="bg-muted/50">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{account.name}</CardTitle>
              <Badge variant={account.accountType === 'Customer' || account.accountType === 'Sales Rep' ? 'default' : 'secondary'} className="mt-1">
                {account.accountType}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground sm:text-right mt-2 sm:mt-0">
              <p>Code: <span className="font-medium text-foreground">{account.accountCode}</span></p>
              {account.createdAt && <p>Created: {format(new Date(account.createdAt.toString()), 'PPP')}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid md:grid-cols-2 gap-x-8 gap-y-4">
          <InfoItem icon={Phone} label="Phone" value={account.phone || 'N/A'} />
          <InfoItem icon={MapPin} label="Address" value={account.address || 'N/A'} fullWidth={!!account.address && account.address.length > 50} />
          <InfoItem icon={Tag} label="Price Level" value={account.priceLevel || 'N/A'} />
          <InfoItem icon={Tag} label="Zone" value={account.zone || 'N/A'} />
          <InfoItem icon={CalendarDays} label="Credit Period" value={`${account.creditPeriod || 0} days`} />
          <InfoItem icon={Banknote} label="Credit Limit" value={formatCurrency(account.creditLimit)} />
          <InfoItem icon={Landmark} label="Bank Details" value={account.bankDetails || 'N/A'} fullWidth={!!account.bankDetails && account.bankDetails.length > 50} isTextarea />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryItem icon={TrendingUp} label="Total Invoiced" value={formatCurrency(totalInvoiced)} />
          <SummaryItem icon={TrendingDown} label="Total Received" value={formatCurrency(totalReceived)} colorClass="text-green-600" />
          <SummaryItem icon={NotebookPen} label="Total Credited" value={formatCurrency(totalCredited)} colorClass="text-orange-500"/>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
                <AlertCircle className={cn("h-5 w-5", creditStatus.color)} />
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", creditStatus.color)}>{formatCurrency(outstandingBalance)}</div>
                <p className={cn("text-xs", creditStatus.color || "text-muted-foreground")}>{creditStatus.msg}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Activity</CardTitle>
          <CardDescription>Recent invoices, receipts, and credit notes related to this account.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Doc #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount (NGN)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{format(new Date(activity.date), 'PP p')}</TableCell>
                    <TableCell>
                      <Badge variant={activity.type === 'Invoice' ? 'secondary' : activity.type === 'Receipt' ? 'default' : 'destructive'}>
                        {activity.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{activity.documentNumber}</TableCell>
                    <TableCell className="max-w-xs truncate" title={activity.description}>{activity.description}</TableCell>
                    <TableCell className={cn(
                        "text-right font-semibold",
                        activity.type === 'Receipt' && "text-green-600",
                        activity.type === 'Credit Note' && "text-orange-500", 
                        activity.type === 'Invoice' && "text-blue-600" 
                    )}>
                      {/* Credit notes reduce outstanding, so shown as positive effect on ledger here (like receipt) but negative on AR overall */}
                      {activity.type === 'Credit Note' ? `-${formatCurrency(activity.amount)}` : formatCurrency(activity.amount)}
                    </TableCell>
                     <TableCell>
                      {activity.status ? <Badge variant={activity.status === 'Paid' || activity.status === 'Completed' || activity.status === 'Received' ? 'default' : activity.status === 'Cancelled' || activity.status === 'Overdue' ? 'destructive' : 'secondary' }>{activity.status}</Badge> : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={activity.detailsLink} passHref>
                        <Button variant="outline" size="sm"><Eye className="mr-1 h-3.5 w-3.5" /> View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No transaction activities found for this account.</p>
          )}
        </CardContent>
         <CardFooter>
          <div className="text-xs text-muted-foreground">End of activity list.</div>
        </CardFooter>
      </Card>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  className?: string;
  fullWidth?: boolean;
  isTextarea?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, className, fullWidth, isTextarea }) => (
  <div className={cn("flex items-start gap-3 py-2", fullWidth ? 'sm:col-span-2' : '')}>
    <Icon className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
    <div>
      <p className="font-medium text-sm text-muted-foreground">{label}</p>
      {isTextarea ? (
        <p className={cn("text-foreground whitespace-pre-wrap text-sm", className)}>{value || 'N/A'}</p>
      ) : (
        <p className={cn("text-foreground text-sm", className)}>{value || 'N/A'}</p>
      )}
    </div>
  </div>
);

interface SummaryItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  colorClass?: string;
}
const SummaryItem: React.FC<SummaryItemProps> = ({ icon: Icon, label, value, colorClass = "text-primary" }) => (
  <Card className="shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <Icon className={cn("h-5 w-5", colorClass)} />
    </CardHeader>
    <CardContent>
      <div className={cn("text-2xl font-bold", colorClass)}>{value}</div>
    </CardContent>
  </Card>
);

