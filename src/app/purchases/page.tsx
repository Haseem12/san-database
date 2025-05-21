
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Search, FileDown, Eye, Edit, Truck } from 'lucide-react';
import type { PurchaseOrder } from '@/types';
import { mockPurchaseOrders } from '@/lib/mockData';
import { format } from 'date-fns';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setPurchaseOrders(mockPurchaseOrders);
  }, []);

  const filteredPurchaseOrders = useMemo(() =>
    purchaseOrders.filter(po =>
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.status.toLowerCase().includes(searchTerm.toLowerCase())
    ), [purchaseOrders, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

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

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold">Purchase Orders</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export POs
          </Button>
          <Link href="/purchases/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Purchase Order
            </Button>
          </Link>
        </div>
      </header>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Purchase Order Management</CardTitle>
          <CardDescription>Track and manage all supplier purchase orders.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search POs by number, supplier, or status..."
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.poNumber}</TableCell>
                  <TableCell>{po.supplier.name}</TableCell>
                  <TableCell>{format(new Date(po.orderDate), 'PP')}</TableCell>
                  <TableCell>{po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'PP') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(po.totalCost)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <Link href={`/purchases/${po.id}`} passHref>
                           <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View PO</DropdownMenuItem>
                        </Link>
                        <Link href={`/purchases/${po.id}/edit`} passHref>
                           <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit PO</DropdownMenuItem>
                        </Link>
                        {/* Add "Receive Items" action later */}
                        {/* <DropdownMenuItem><Truck className="mr-2 h-4 w-4" /> Receive Items</DropdownMenuItem> */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Cancel PO</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredPurchaseOrders.length}</strong> of <strong>{purchaseOrders.length}</strong> purchase orders
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
