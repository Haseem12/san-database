
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Search, FileDown, Edit } from 'lucide-react';
import type { Product } from '@/types';
import { mockProducts } from '@/lib/mockData';
import Image from 'next/image';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
const [modalVisible, setModalVisible] = useState(false);
const [modalMessage, setModalMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });


  useEffect(() => {
    fetch("https://sajfoods.net/busa-api/database/get_products.php")
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch((error) => {
        console.error("Failed to fetch products:", error);
      });
  }, []);
  
  
  const confirmDelete = async () => {
    if (!selectedProduct) return;
  
    try {
      const res = await fetch("https://sajfoods.net/busa-api/database/delete_product.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedProduct.id }),
      });
  
      const result = await res.json();
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
        setModalMessage({ text: "Product deleted successfully.", type: "success" });
      } else {
        setModalMessage({ text: result.message || "Failed to delete product.", type: "error" });
      }
    } catch (err) {
      setModalMessage({ text: "Error deleting product.", type: "error" });
    }
  
    // Hide after delay
    setTimeout(() => {
      setModalVisible(false);
      setModalMessage({ text: '', type: '' });
      setSelectedProduct(null);
    }, 3000);
  };
  
  
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/products/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </header>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>Manage your products and their details.</CardDescription>
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
                <TableHead className="hidden w-[80px] sm:table-cell">
                  Image
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category (Under)</TableHead>
                <TableHead>Unit of Measure</TableHead>
                <TableHead className="hidden md:table-cell text-right">Stock</TableHead>
                <TableHead className="text-right">Price (NGN)</TableHead>
                <TableHead className="text-right">Cost (NGN)</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
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
                  <TableCell className="hidden md:table-cell text-right">{product.stock}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.costPrice || 0)}</TableCell>
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
                        <Link href={`/products/${product.id}/edit`} passHref>
                           <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        </Link>
                        {/* <DropdownMenuItem>View Details</DropdownMenuItem> */}
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
  onClick={() => {
    setSelectedProduct(product);
    setModalMessage({ text: '', type: '' });
    setModalVisible(true);
  }}
  className="text-destructive"
>
  Delete
</DropdownMenuItem>


                        
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
            Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
          </div>
        </CardFooter>
      </Card>
      {modalVisible && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
      {!modalMessage.text ? (
        <>
          <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
          <p>Are you sure you want to delete <strong>{selectedProduct?.name}</strong>?</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalVisible(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </>
      ) : (
        <div className={`text-sm p-4 rounded ${modalMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {modalMessage.text}
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
}
