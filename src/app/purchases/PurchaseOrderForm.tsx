
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerComponent } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseOrder, PurchaseItem, RawMaterial, LedgerAccount, UnitOfMeasure } from '@/types'; // Changed Product to RawMaterial
import { purchaseOrderStatuses } from '@/types';
import { mockRawMaterials, mockLedgerAccounts, mockPurchaseOrders } from '@/lib/mockData'; // Changed mockProducts to mockRawMaterials

interface PurchaseOrderFormProps {
  purchaseOrder?: PurchaseOrder;
  onSave: (po: PurchaseOrder) => void;
}

const newEmptyPurchaseItem = (): Omit<PurchaseItem, 'productName' | 'unitCost' | 'totalCost'> & { productId: string } => ({
  productId: '', // This will be RawMaterial ID
  quantity: 1,
});

export default function PurchaseOrderForm({ purchaseOrder: existingPO, onSave }: PurchaseOrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [poNumber, setPoNumber] = useState(existingPO?.poNumber || `PO-${new Date().getFullYear()}-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>(existingPO?.supplier.id);
  const [selectedSupplier, setSelectedSupplier] = useState<LedgerAccount | null>(null);
  
  const [orderDate, setOrderDate] = useState<Date | undefined>(existingPO ? new Date(existingPO.orderDate) : new Date());
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | undefined>(
    existingPO?.expectedDeliveryDate ? new Date(existingPO.expectedDeliveryDate) : undefined
  );
  
  const [items, setItems] = useState<Array<Partial<PurchaseItem> & { productId: string }>>(
    existingPO?.items.map(item => ({ ...item, productId: item.productId, unitOfMeasure: item.unitOfMeasure })) || [newEmptyPurchaseItem()]
  );
  
  const [status, setStatus] = useState<PurchaseOrder['status']>(existingPO?.status || 'Draft');
  const [notes, setNotes] = useState(existingPO?.notes || '');
  const [shippingCost, setShippingCost] = useState(existingPO?.shippingCost || 0);
  const [otherCharges, setOtherCharges] = useState(existingPO?.otherCharges || 0);
  
  const [isLoading, setIsLoading] = useState(false);

  const supplierAccounts = useMemo(() => mockLedgerAccounts.filter(acc => acc.accountType === 'Supplier'), []);

  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = supplierAccounts.find(s => s.id === selectedSupplierId);
      setSelectedSupplier(supplier || null);
    } else {
      setSelectedSupplier(null);
    }
  }, [selectedSupplierId, supplierAccounts]);

  const handleItemChange = (index: number, field: keyof PurchaseItem | 'productId', value: string | number) => {
    const updatedItems = [...items];
    const currentItem = { ...updatedItems[index] };

    if (field === 'productId') {
      currentItem.productId = value as string; // RawMaterial ID
      const rawMaterial = mockRawMaterials.find(p => p.id === currentItem.productId); // Find in mockRawMaterials
      if (rawMaterial) {
        currentItem.productName = rawMaterial.name;
        currentItem.unitCost = rawMaterial.costPrice || 0; 
        currentItem.unitOfMeasure = rawMaterial.unitOfMeasure;
      } else {
         currentItem.productName = '';
         currentItem.unitCost = 0;
         currentItem.unitOfMeasure = undefined;
      }
    } else if (field === 'quantity') {
      currentItem.quantity = Number(value) || 0;
    } else if (field === 'unitCost') {
      currentItem.unitCost = Number(value) || 0;
    }
    
    currentItem.totalCost = (currentItem.unitCost || 0) * (currentItem.quantity || 0);
    updatedItems[index] = currentItem;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, newEmptyPurchaseItem()]);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems.length > 0 ? updatedItems : [newEmptyPurchaseItem()]);
  };

  const subTotal = useMemo(() => items.reduce((sum, item) => sum + (item.totalCost || 0), 0), [items]);
  const totalCost = useMemo(() => subTotal + (shippingCost || 0) + (otherCharges || 0), [subTotal, shippingCost, otherCharges]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!selectedSupplier || !orderDate || !status || items.some(item => !item.productId || item.quantity === undefined || item.quantity <= 0)) {
      toast({
        title: "Missing Information",
        description: "Please select a supplier, set order date, status, and ensure all items have a product/material and quantity.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const finalItems: PurchaseItem[] = items.map(item => {
      const rawMaterial = mockRawMaterials.find(p => p.id === item.productId); // Find in mockRawMaterials
      if (!rawMaterial) throw new Error("Invalid raw material in items.");
      const unitCost = item.unitCost || rawMaterial.costPrice || 0;
      return {
        productId: item.productId!,
        productName: rawMaterial.name,
        quantity: item.quantity!,
        unitCost: unitCost,
        totalCost: unitCost * item.quantity!,
        unitOfMeasure: rawMaterial.unitOfMeasure,
      };
    });

    const newPO: PurchaseOrder = {
      id: existingPO?.id || `po_${Date.now()}`,
      poNumber,
      orderDate,
      expectedDeliveryDate,
      supplier: {
        id: selectedSupplier.id,
        name: selectedSupplier.name,
      },
      items: finalItems,
      subTotal,
      shippingCost: shippingCost || 0,
      otherCharges: otherCharges || 0,
      totalCost,
      status,
      notes,
      createdAt: existingPO?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(newPO);
    
    toast({
      title: existingPO ? "Purchase Order Updated" : "Purchase Order Created",
      description: `Purchase Order "${newPO.poNumber}" has been successfully ${existingPO ? 'updated' : 'created'}.`,
    });
    router.push('/purchases'); 
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{existingPO ? 'Edit Purchase Order' : 'Create New Purchase Order'}</CardTitle>
          <CardDescription>
            {existingPO ? `Editing PO ${existingPO.poNumber}` : 'Fill in the details for the new purchase order.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="supplier">Supplier (Ledger Account) <span className="text-destructive">*</span></Label>
              <Select onValueChange={setSelectedSupplierId} value={selectedSupplierId} required>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select supplier account" />
                </SelectTrigger>
                <SelectContent>
                  {supplierAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="poNumber">PO Number</Label>
              <Input id="poNumber" value={poNumber} onChange={e => setPoNumber(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value: PurchaseOrder['status']) => setStatus(value)} value={status} required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrderStatuses.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
             <div>
              <Label htmlFor="orderDate">Order Date <span className="text-destructive">*</span></Label>
              <DatePickerComponent date={orderDate} setDate={setOrderDate} />
            </div>
            <div>
              <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
              <DatePickerComponent date={expectedDeliveryDate} setDate={setExpectedDeliveryDate} placeholder="Optional delivery date"/>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Items (Raw Materials/Store Items)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Unit Cost (NGN)</TableHead>
                <TableHead className="text-right">Total Cost (NGN)</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={item.productId} // productId now refers to RawMaterial ID
                      onValueChange={(value) => handleItemChange(index, 'productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockRawMaterials.map(material => ( // Use mockRawMaterials
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.unitOfMeasure}{material.unitOfMeasure === 'Litres' && material.litres ? ` - ${material.litres}L` : ''}) - Cost: {formatCurrency(material.costPrice || 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      disabled={!item.productId}
                    />
                  </TableCell>
                  <TableCell>{item.unitOfMeasure || 'N/A'}</TableCell>
                   <TableCell>
                    <Input
                        type="number"
                        value={item.unitCost || 0}
                        onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                        min="0"
                        step="0.01"
                        className="text-right"
                        disabled={!item.productId}
                    />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.totalCost || 0)}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea placeholder="Optional notes for the purchase order..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <Label>Subtotal:</Label>
              <span>{formatCurrency(subTotal)}</span>
            </div>
             <div className="flex justify-between items-center">
              <Label htmlFor="shippingCost">Shipping Cost (NGN):</Label>
              <Input 
                id="shippingCost"
                type="number" 
                value={shippingCost} 
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)} 
                className="w-32 text-right"
                placeholder="0.00"
                min="0"
              />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="otherCharges">Other Charges (NGN):</Label>
              <Input 
                id="otherCharges"
                type="number" 
                value={otherCharges} 
                onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)} 
                className="w-32 text-right"
                placeholder="0.00"
                min="0"
              />
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <Label>Total Cost:</Label>
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-2 mt-8">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !selectedSupplier || items.some(item => !item.productId)}>
          {isLoading ? (existingPO ? 'Updating...' : 'Creating...') : (existingPO ? 'Save Changes' : 'Create Purchase Order')}
        </Button>
      </div>
    </form>
  );
}
