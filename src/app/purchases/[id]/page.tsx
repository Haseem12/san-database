
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Edit, ShoppingBag, CalendarDays, DollarSign, Info, Hash, Truck, AlertCircle, CheckCircle2, Box, User } from 'lucide-react';
import type { PurchaseOrder, PurchaseItem } from '@/types';
import { defaultCompanyDetails } from '@/types'; // Import from @/types
import { mockPurchaseOrders } from '@/lib/mockData'; 
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const poId = params.id as string;

  useEffect(() => {
    if (poId) {
      const foundPO = mockPurchaseOrders.find(po => po.id === poId);
      setPurchaseOrder(foundPO || null);
      setIsLoading(false);
    }
  }, [poId]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const getStatusBadgeVariant = (status: PurchaseOrder['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Received': return 'default'; 
      case 'Ordered': return 'secondary'; 
      case 'Draft': return 'outline'; 
      case 'Partially Received': return 'outline'; 
      case 'Cancelled': return 'destructive'; 
      default: return 'outline';
    }
  };

  const handleReceiveItems = () => {
    if (!purchaseOrder) return;
    const updatedPO = { ...purchaseOrder, status: 'Received' as PurchaseOrder['status'], updatedAt: new Date() };
    const index = mockPurchaseOrders.findIndex(p => p.id === poId);
    if (index !== -1) {
      mockPurchaseOrders[index] = updatedPO;
    }
    setPurchaseOrder(updatedPO);
    router.refresh(); 
  };


  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Loading purchase order details...</p></div>;
  }

  if (!purchaseOrder) {
    return (
       <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4">Purchase Order not found.</p>
        <Link href="/purchases" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Purchase Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/purchases" passHref>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Purchase Orders</span>
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/purchases/${purchaseOrder.id}/edit`} passHref>
            <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
          </Link>
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
          {purchaseOrder.status === 'Ordered' || purchaseOrder.status === 'Partially Received' ? (
            <Button onClick={handleReceiveItems}><Truck className="mr-2 h-4 w-4" /> Mark as Received</Button>
          ) : purchaseOrder.status === 'Received' ? (
            <Button variant="ghost" disabled className="text-green-600"><CheckCircle2 className="mr-2 h-4 w-4" /> Fully Received</Button>
          ): null}
        </div>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader className="bg-muted/50 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Purchase Order {purchaseOrder.poNumber}</h1>
              <Badge variant={getStatusBadgeVariant(purchaseOrder.status)} className="mt-1">{purchaseOrder.status}</Badge>
            </div>
            <div className="text-right">
              <p className="font-semibold">{defaultCompanyDetails.name}</p>
              <p className="text-sm text-muted-foreground">{defaultCompanyDetails.address}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Supplier Details:</h3>
              <Link href={`/ledger-accounts/${purchaseOrder.supplier.id}`} passHref>
                <Button variant="link" className="p-0 h-auto text-base font-medium text-primary hover:underline">
                 <User className="mr-2 h-4 w-4" /> {purchaseOrder.supplier.name}
                </Button>
              </Link>
            </div>
            <div className="text-right md:text-left">
              <p><span className="font-semibold">Order Date:</span> {format(new Date(purchaseOrder.orderDate), 'PPP')}</p>
              {purchaseOrder.expectedDeliveryDate && 
                <p><span className="font-semibold">Expected Delivery:</span> {format(new Date(purchaseOrder.expectedDeliveryDate), 'PPP')}</p>
              }
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Unit</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrder.items.map((item, index) => (
                <TableRow key={`${item.productId}-${index}`}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">{item.unitOfMeasure}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(purchaseOrder.subTotal)}</span>
              </div>
              {purchaseOrder.shippingCost && purchaseOrder.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span>Shipping Cost:</span>
                  <span>{formatCurrency(purchaseOrder.shippingCost)}</span>
                </div>
              )}
              {purchaseOrder.otherCharges && purchaseOrder.otherCharges > 0 && (
                <div className="flex justify-between">
                  <span>Other Charges:</span>
                  <span>{formatCurrency(purchaseOrder.otherCharges)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total Cost:</span>
                <span>{formatCurrency(purchaseOrder.totalCost)}</span>
              </div>
            </div>
          </div>
          
          {purchaseOrder.notes && (
            <div className="mt-8 border-t pt-4">
              <h4 className="font-semibold mb-1">Notes:</h4>
              <p className="text-sm text-muted-foreground">{purchaseOrder.notes}</p>
            </div>
          )}

        </CardContent>
        <CardFooter className="bg-muted/50 p-6 text-center text-xs text-muted-foreground">
          <p>Please ensure items are delivered by the expected date. Contact us for any discrepancies.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

