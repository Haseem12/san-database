"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, PackagePlus, AlertTriangle, CheckCircle2, Edit, UserCircle2 } from 'lucide-react';
import type { RawMaterial } from '@/types'; 
import { mockRawMaterials, mockLedgerAccounts } from '@/lib/mockData'; 
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function InventoryPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setRawMaterials(mockRawMaterials); 
  }, []);

  const getSupplierName = (supplierId?: string): string => {
    if (!supplierId) return 'N/A';
    const supplier = mockLedgerAccounts.find(acc => acc.id === supplierId && acc.accountType === 'Supplier');
    return supplier ? supplier.name : 'Unknown Supplier';
  };

  const filteredRawMaterials = useMemo(() =>
    rawMaterials.filter(material =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.supplierId && getSupplierName(material.supplierId).toLowerCase().includes(searchTerm.toLowerCase()))
    ), [rawMaterials, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const getStockStatus = (material: RawMaterial): { text: string; variant: "default" | "destructive" | "secondary"; icon: React.ElementType } => {
    const threshold = material.lowStockThreshold || 10; 
    if (material.stock <= 0) {
      return { text: 'Out of Stock', variant: 'destructive', icon: AlertTriangle };
    }
    if (material.stock <= threshold) {
      return { text: 'Low Stock', variant: 'destructive', icon: AlertTriangle };
    }
    return { text: 'In Stock', variant: 'default', icon: CheckCircle2 };
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold">Store Management (Raw Materials & Store Items)</h1>
        <div className="flex items-center gap-2">
           <Link href="/store/new"> 
            <Button>
              <PackagePlus className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          </Link>
        </div>
      </header>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Raw Material & Store Item Stock</CardTitle>
          <CardDescription>Monitor and manage current inventory levels of raw materials and store items.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items by name, SKU, category, or supplier..."
              className="pl-8 w-full md:w-2/3 lg:w-1/2"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[80px] sm:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="hidden md:table-cell">Supplier</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Cost Price (NGN)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRawMaterials.map((material) => {
                const stockStatus = getStockStatus(material);
                return (
                  <TableRow key={material.id}>
                    <TableCell className="hidden sm:table-cell">
                      {material.imageUrl ? (
                         <Image
                          alt={material.name}
                          className="aspect-square rounded-md object-cover"
                          data-ai-hint="raw material image"
                          height="48"
                          src={material.imageUrl}
                          width="48"
                        />
                      ) : (
                        <div className="aspect-square rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground h-12 w-12">
                          No Img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.sku}</TableCell>
                    <TableCell>{material.category}</TableCell>
                    <TableCell>{material.unitOfMeasure} {material.unitOfMeasure === 'Litres' && material.litres ? `(${material.litres}L)` : ''}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {material.supplierId ? (
                        <div className="flex items-center gap-1">
                          <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" /> 
                          {getSupplierName(material.supplierId)}
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">{material.stock}</TableCell>
                    <TableCell className="text-right">{formatCurrency(material.costPrice || 0)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={stockStatus.variant} className="flex items-center justify-center gap-1">
                        <stockStatus.icon className="h-3.5 w-3.5" />
                        {stockStatus.text}
                      </Badge>
                    </TableCell>
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
                          <Link href={`/store/${material.id}/edit`} passHref>
                             <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredRawMaterials.length}</strong> of <strong>{rawMaterials.length}</strong> items in inventory.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
