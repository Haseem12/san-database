
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { LedgerAccount, LedgerAccountType } from '@/types';
import { ledgerAccountTypes, priceLevelOptions as predefinedAccountCodes } from '@/types'; 
import { parseAccountCodeDetails } from '@/lib/utils'; 

interface LedgerAccountFormProps {
  account?: LedgerAccount; 
  onSaveSuccess?: (accountId: string) => void;
}

export default function LedgerAccountForm({ account, onSaveSuccess }: LedgerAccountFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<LedgerAccount>>({
    name: account?.name || '',
    accountCode: account?.accountCode || '',
    creditPeriod: account?.creditPeriod || 0,
    creditLimit: account?.creditLimit || 0,
    address: account?.address || '',
    phone: account?.phone || '',
    accountType: account?.accountType || ledgerAccountTypes[0],
    bankDetails: account?.bankDetails || '',
  });

  const [derivedPriceLevel, setDerivedPriceLevel] = useState(account?.priceLevel || 'N/A');
  const [derivedZone, setDerivedZone] = useState(account?.zone || 'N/A');
  const [isLoading, setIsLoading] = useState(false);

  const updateDerivedFields = useCallback((code: string) => {
    const { priceLevel, zone } = parseAccountCodeDetails(code);
    setDerivedPriceLevel(priceLevel);
    setDerivedZone(zone);
  }, []);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        accountCode: account.accountCode,
        priceLevel: account.priceLevel, // Ensure priceLevel and zone are part of formData if they are to be saved or derive them pre-save
        zone: account.zone,
        creditPeriod: account.creditPeriod,
        creditLimit: account.creditLimit,
        address: account.address,
        phone: account.phone,
        accountType: account.accountType,
        bankDetails: account.bankDetails,
      });
      updateDerivedFields(account.accountCode);
    }
  }, [account, updateDerivedFields]);

  useEffect(() => {
    if (formData.accountCode) {
      updateDerivedFields(formData.accountCode);
    }
  }, [formData.accountCode, updateDerivedFields]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['creditPeriod', 'creditLimit'];
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  const handleAccountCodeSelectChange = (newCode: string) => {
    setFormData(prev => ({ ...prev, accountCode: newCode }));
  };

  const handleAccountTypeChange = (value: LedgerAccountType) => {
    setFormData(prev => ({ ...prev, accountType: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.accountCode || !formData.accountType) {
      toast({
        title: "Missing Information",
        description: "Please fill in Name, Account Code, and Account Type.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { priceLevel: derivedPL, zone: derivedZ } = parseAccountCodeDetails(formData.accountCode || '');

    const payload: any = {
      name: formData.name,
      accountCode: formData.accountCode,
      priceLevel: derivedPL, // Use derived price level
      zone: derivedZ,       // Use derived zone
      creditPeriod: formData.creditPeriod || 0,
      creditLimit: formData.creditLimit || 0,
      address: formData.address || '',
      phone: formData.phone || '',
      accountType: formData.accountType,
      bankDetails: formData.bankDetails || '',
      createdAt: account?.createdAt ? (account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (account?.id) {
        payload.id = account.id;
    }


    try {
      const res = await fetch('https://sajfoods.net/busa-api/database/save_ledger_account.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server Response Error Text (Ledger Account):", errorText);
        throw new Error(`Server error: ${res.status} - ${errorText || res.statusText}`);
      }
      const result = await res.json();
      console.log("Save Ledger Account Response:", result);


      if (result.success) {
        toast({ title: "Success", description: result.message });

        const savedAccountId = result.id || account?.id || ''; // Use returned ID or existing if updating

        if (onSaveSuccess) {
          onSaveSuccess(savedAccountId); // Pass the ID for redirection logic in parent
        } else if (result.redirect) { // If PHP suggests a redirect path
          router.push(result.redirect);
        } else if (savedAccountId) { // Fallback to detail page if ID is known
          router.push(`/ledger-accounts/${savedAccountId}`);
        }
         else { // Default fallback
          router.push('/ledger-accounts');
        }
      } else {
        console.error("PHP Script Error (Ledger Account):", result.message || "Unknown error from PHP script.");
        throw new Error(result.message || "An unknown error occurred on the server.");
      }

    } catch (error: any) {
      console.error("Error saving ledger account:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Could not save ledger account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{account ? 'Edit Ledger Account' : 'Create New Ledger Account'}</CardTitle>
          <CardDescription>
            {account ? 'Edit the details of this ledger account.' : 'Enter the details for the new ledger account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="accountCode">Account Code <span className="text-destructive">*</span></Label>
              <Select name="accountCode" onValueChange={handleAccountCodeSelectChange} value={formData.accountCode} required>
                <SelectTrigger id="accountCode" aria-label="Select account code">
                  <SelectValue placeholder="Select account code" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedAccountCodes.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label>Derived Price Level</Label>
              <Input value={derivedPriceLevel} readOnly disabled className="bg-muted/50" />
            </div>
            <div className="grid gap-3">
              <Label>Derived Zone</Label>
              <Input value={derivedZone} readOnly disabled className="bg-muted/50" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label htmlFor="accountType">Account Type <span className="text-destructive">*</span></Label>
              <Select name="accountType" onValueChange={handleAccountTypeChange} value={formData.accountType} required>
                <SelectTrigger id="accountType" aria-label="Select account type">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ledgerAccountTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} className="min-h-24" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label htmlFor="creditPeriod">Credit Period (days)</Label>
              <Input id="creditPeriod" name="creditPeriod" type="number" value={formData.creditPeriod || ''} onChange={handleInputChange} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input id="creditLimit" name="creditLimit" type="number" value={formData.creditLimit || ''} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="bankDetails">Bank Details</Label>
            <Textarea id="bankDetails" name="bankDetails" value={formData.bankDetails} onChange={handleInputChange} className="min-h-20" />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

