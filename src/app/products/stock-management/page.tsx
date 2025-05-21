
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, PackagePlus, Layers, Edit, AlertTriangle, CheckCircle2, PlusCircle } from 'lucide-react';
import type { Product } from '@/types';
// mockProducts import removed
import Image from 'next/image';
import AddStockDialog from './AddStockDialog';
import { useToast } from '@/hooks/use-toast';

export default function ProductStockManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("https://sajfoods.net/busa-api/database/get_products.php");
        if (!response.ok) {
          let errorText = `HTTP error! status: ${response.status}`;
          try {
            const errJson = await response.json();
            errorText = errJson.message || errorText;
          } catch (e) { /* Ignore if response is not JSON */ }
          throw new Error(errorText);
        }
        const data = await response.json();
        if (Array.isArray(data)) { // Assuming PHP returns a direct array
          setProducts(data.map(p => ({
            ...p,
            // Ensure priceTiers is an array, parsing if it's a string
            priceTiers: typeof p.priceTiers === 'string' ? JSON.parse(p.priceTiers || '[]') : (p.priceTiers || []),
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          })));
        } else if (data && data.success === true && Array.isArray(data.data)) { // If PHP returns {success: true, data: [...]}
           setProducts(data.data.map(p => ({
            ...p,
            priceTiers: typeof p.priceTiers === 'string' ? JSON.parse(p.priceTiers || '[]') : (p.priceTiers || []),
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          })));
        } else {
          throw new Error(data.message || "Fetched data is not in expected format.");
        }
      } catch (error: any) {
        console.error("Failed to fetch products for stock management:", error);
        toast({
          title: 'Error Fetching Products',
          description: error.message || 'Could not load products from the server.',
          variant: 'destructive',
        });
        setProducts([]); // Set to empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [toast]);

  const filteredProducts = useMemo(() =>
    products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.productCategory && product.productCategory.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [products, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleAddStockClick = (product: Product) => {
    setSelectedProductForStock(product);
    setIsAddStockDialogOpen(true);
  };

  const handleConfirmAddStock = async (productId: string, quantityToAdd: number) => {
    const productToUpdate = products.find(p => p.id === productId);
    if (!productToUpdate) return;

    try {
      const response = await fetch('https://sajfoods.net/busa-api/database/update_product_stock.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantityToAdd }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || 'Failed to update stock on server.');
      }

      const result = await response.json();

      if (result.success) {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === productId ? { ...p, stock: result.newStock !== undefined ? result.newStock : p.stock + quantityToAdd, updatedAt: new Date() } : p
          )
        );
        toast({
          title: 'Stock Added',
          description: `${quantityToAdd} units added to "${productToUpdate.name}". New stock: ${result.newStock !== undefined ? result.newStock : productToUpdate.stock + quantityToAdd}.`,
        });
      } else {
        throw new Error(result.message || "Server responded with an error during stock update.");
      }
    } catch (error: any) {
      console.error("Error updating stock:", error);
      toast({
        title: 'Stock Update Failed',
        description: error.message || 'Could not update stock. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const getStockStatus = (product: Product): { text: string; variant: "default" | "destructive" | "secondary" | "outline"; icon: React.ElementType } => {
    const threshold = product.lowStockThreshold || 10; 
    if (product.stock <= 0) {
      return { text: 'Out of Stock', variant: 'destructive', icon: AlertTriangle };
    }
    if (product.stock <= threshold) {
      return { text: 'Low Stock', variant: 'destructive', icon: AlertTriangle };
    }
    return { text: 'In Stock', variant: 'default', icon: CheckCircle2 };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Loading product stock levels...</p></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold flex items-center">
          <Layers className="mr-2 h-6 w-6" /> Product Stock Management
        </h1>
        <div className="flex items-center gap-2">
           <Link href="/products/new">
            <Button>
              <PackagePlus className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
          </Link>
        </div>
      </header>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Finished Product Stock Levels</CardTitle>
          <CardDescription>View and manage current stock for your finished products (e.g., yogurts).</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products by name, SKU, or category..."
              className="pl-8 w-full md:w-1/2 lg:w-1/3"
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
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      {product.imageUrl ? (
                         <Image
                          alt={product.name}
                          className="aspect-square rounded-md object-cover"
                          data-ai-hint="product image"
                          height="48"
                          src={product.imageUrl}
                          width="48"
                        />
                      ) : (
                        <div className="aspect-square rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground h-12 w-12">
                          No Img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.productCategory}</TableCell>
                    <TableCell>{product.unitOfMeasure} {product.unitOfMeasure === 'Litres' && product.litres ? `(${product.litres}L)` : ''}</TableCell>
                    <TableCell className="text-right font-semibold">{product.stock}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={stockStatus.variant} className="flex items-center justify-center gap-1">
                        <stockStatus.icon className="h-3.5 w-3.5" />
                        {stockStatus.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" variant="outline" onClick={() => handleAddStockClick(product)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                 <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products.
          </div>
        </CardFooter>
      </Card>
      <AddStockDialog
        isOpen={isAddStockDialogOpen}
        onOpenChange={setIsAddStockDialogOpen}
        product={selectedProductForStock}
        onAddStock={handleConfirmAddStock}
      />
    </div>
  );
}
 
