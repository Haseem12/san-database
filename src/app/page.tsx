
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, ShoppingCart, FileText, Package, Users, TrendingUp, Activity, BookUser, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import type { Sale, Invoice, Product as ProductType } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DashboardActivity {
  id: string;
  date: Date;
  type: 'Sale' | 'Invoice';
  title: string;
  subtitle: string;
  amount?: number;
  icon: React.ElementType;
  iconColorClass: string;
  link?: string;
}

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [salesRes, invoicesRes, productsRes] = await Promise.all([
          fetch('https://sajfoods.net/busa-api/database/get_sales.php'),
          fetch('https://sajfoods.net/busa-api/database/get_invoices.php'),
          fetch('https://sajfoods.net/busa-api/database/get_products.php')
        ]);

        // Process Sales
        if (!salesRes.ok) throw new Error(`Sales fetch failed: ${salesRes.statusText} (Status: ${salesRes.status})`);
        const salesData = await salesRes.json();
        if (salesData.success && Array.isArray(salesData.data)) {
          setSales(salesData.data.map((s: any) => {
            const saleId = (s.id !== null && s.id !== undefined) ? String(s.id) : `fallback_sale_${Math.random().toString(36).substring(2, 9)}`;
            const customerNameStr = (s.customer && typeof s.customer === 'object' && s.customer.name) ? String(s.customer.name) : 'N/A';
            return {
              ...s,
              id: saleId,
              saleDate: s.saleDate ? (isValid(parseISO(String(s.saleDate).replace(" ", "T"))) ? parseISO(String(s.saleDate).replace(" ", "T")) : new Date()) : new Date(),
              createdAt: s.createdAt ? (isValid(parseISO(String(s.createdAt).replace(" ", "T"))) ? parseISO(String(s.createdAt).replace(" ", "T")) : new Date()) : new Date(),
              customer: { ...(s.customer || {}), name: customerNameStr },
              totalAmount: Number(s.totalAmount) || 0,
            };
          }));
        } else {
          console.warn("Failed to fetch sales or data format incorrect:", salesData.message);
          setSales([]);
        }

        // Process Invoices
        if (!invoicesRes.ok) throw new Error(`Invoices fetch failed: ${invoicesRes.statusText} (Status: ${invoicesRes.status})`);
        const invoicesData = await invoicesRes.json();
        if (invoicesData.success && Array.isArray(invoicesData.data)) {
          setInvoices(invoicesData.data.map((i: any) => {
            const invoiceId = (i.id !== null && i.id !== undefined) ? String(i.id) : `fallback_inv_${Math.random().toString(36).substring(2, 9)}`;
            const customerNameStr = (i.customer && typeof i.customer === 'object' && i.customer.name) ? String(i.customer.name) : 'N/A';
            return {
              ...i,
              id: invoiceId,
              issueDate: i.issueDate ? (isValid(parseISO(String(i.issueDate).replace(" ", "T"))) ? parseISO(String(i.issueDate).replace(" ", "T")) : new Date()) : new Date(),
              createdAt: i.createdAt ? (isValid(parseISO(String(i.createdAt).replace(" ", "T"))) ? parseISO(String(i.createdAt).replace(" ", "T")) : new Date()) : new Date(),
              customer: { ...(i.customer || {}), name: customerNameStr },
              totalAmount: Number(i.totalAmount) || 0,
            };
          }));
        } else {
          console.warn("Failed to fetch invoices or data format incorrect:", invoicesData.message);
          setInvoices([]);
        }
        
        // Process Products
        if (!productsRes.ok) throw new Error(`Products fetch failed: ${productsRes.statusText} (Status: ${productsRes.status})`);
        const productsResponse = await productsRes.json();
        let productsDataToSet: ProductType[] = [];
        if (Array.isArray(productsResponse)) { // Direct array
            productsDataToSet = productsResponse;
        } else if (productsResponse.success && Array.isArray(productsResponse.data)) { // Object with data property
            productsDataToSet = productsResponse.data;
        } else {
            console.warn("Failed to fetch products or data format incorrect:", productsResponse.message);
        }
        setProducts(productsDataToSet.map((p: any) => {
          const productId = (p.id !== null && p.id !== undefined) ? String(p.id) : `fallback_prod_${Math.random().toString(36).substring(2, 9)}`;
          return {
            ...p,
            id: productId,
            createdAt: p.createdAt ? (isValid(parseISO(String(p.createdAt).replace(" ", "T"))) ? parseISO(String(p.createdAt).replace(" ", "T")) : new Date()) : new Date(),
            stock: Number(p.stock) || 0,
            lowStockThreshold: Number(p.lowStockThreshold) || 0,
            priceTiers: typeof p.priceTiers === 'string' ? JSON.parse(p.priceTiers || '[]') : (p.priceTiers || [])
          };
        }));

      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard data.");
        toast({ title: "Error", description: err.message || "Could not load dashboard data.", variant: "destructive" });
        // Set states to empty arrays on error to prevent issues with undefined data
        setSales([]);
        setInvoices([]);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const summaryStats = useMemo(() => {
    const totalRevenue = sales
      .filter(s => s.status === 'Completed')
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    
    const totalSalesCount = sales.length;

    const pendingInvoicesCount = invoices.filter(
      i => i.status === 'Draft' || i.status === 'Sent' || i.status === 'Overdue'
    ).length;

    const lowStockItemsCount = products.filter(
      p => (Number(p.stock) || 0) <= (Number(p.lowStockThreshold) || 0)
    ).length;

    return {
      totalRevenue,
      totalSales: totalSalesCount,
      pendingInvoices: pendingInvoicesCount,
      lowStockItems: lowStockItemsCount,
    };
  }, [sales, invoices, products]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  useEffect(() => {
    if (isLoading || error) return;

    const salesActivities: DashboardActivity[] = sales.map(s => {
      const saleIdStr = String(s.id || `fallback_sale_${Math.random()}`);
      return {
        id: saleIdStr,
        date: new Date(s.createdAt || s.saleDate || Date.now()), 
        type: 'Sale',
        title: `Sale #${saleIdStr.includes('_') ? (saleIdStr.split('_')[1] || saleIdStr) : saleIdStr}`,
        subtitle: `Customer: ${s.customer?.name || 'N/A'}`,
        amount: Number(s.totalAmount) || 0,
        icon: ShoppingCart,
        iconColorClass: 'text-green-500',
        link: `/sales/${saleIdStr}`
      };
    });

    const invoiceActivities: DashboardActivity[] = invoices.map(i => {
      const invoiceIdStr = String(i.id || `fallback_inv_${Math.random()}`);
      return {
        id: invoiceIdStr,
        date: new Date(i.createdAt || i.issueDate || Date.now()),
        type: 'Invoice',
        title: `Invoice ${i.invoiceNumber || invoiceIdStr}`,
        subtitle: `Status: ${i.status}`,
        amount: Number(i.totalAmount) || 0,
        icon: FileText,
        iconColorClass: 'text-blue-500',
        link: `/invoices/${invoiceIdStr}`
      };
    });

    const combined = [...salesActivities, ...invoiceActivities]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5); 

    setRecentActivities(combined);
  }, [sales, invoices, isLoading, error]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <RefreshCw className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-lg font-semibold text-destructive">Failed to load dashboard data</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => { setIsLoading(true); /* Re-trigger fetch logic if needed, or simply reload */ window.location.reload(); }}>
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Completed Sales)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Recorded</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{summaryStats.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Needs reordering</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link href="/sales/new" passHref>
              <Button className="w-full">
                <ShoppingCart className="mr-2 h-4 w-4" /> New Sale
              </Button>
            </Link>
            <Link href="/invoices/new" passHref>
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" /> New Invoice
              </Button>
            </Link>
            <Link href="/products/new" passHref>
              <Button className="w-full">
                <Package className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </Link>
            <Link href="/ledger-accounts/new" passHref>
               <Button className="w-full">
                <Users className="mr-2 h-4 w-4" /> Add Ledger Account
              </Button>
            </Link>
            <Link href="/ledger-accounts" passHref>
              <Button className="w-full col-span-2 sm:col-span-1">
                <BookUser className="mr-2 h-4 w-4" /> Manage Accounts
              </Button>
            </Link>
             <Link href="/activities" passHref>
              <Button className="w-full col-span-2 sm:col-span-1">
                <Activity className="mr-2 h-4 w-4" /> View All Activities
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <ul className="space-y-3">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <activity.icon className={cn("h-5 w-5", activity.iconColorClass)} />
                      <div>
                        <p className="font-medium">
                          {activity.link ? <Link href={activity.link} className="hover:underline">{activity.title}</Link> : activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                        {activity.amount !== undefined && (
                            <span className="text-sm font-semibold">{formatCurrency(activity.amount)}</span>
                        )}
                        <p className="text-xs text-muted-foreground">{format(activity.date, 'PP')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent sales or invoice activities found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
