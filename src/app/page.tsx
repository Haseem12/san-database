
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, ShoppingCart, FileText, Package, Users, TrendingUp, Activity, BookUser, CheckCircle, AlertCircle } from "lucide-react";
import type { Sale, Invoice, Product as ProductType } from '@/types';
import { mockSales, mockInvoices, mockProducts } from '@/lib/mockData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardActivity {
  id: string;
  date: Date;
  type: 'Sale' | 'Invoice' | 'Product Added';
  title: string;
  subtitle: string;
  amount?: number;
  icon: React.ElementType;
  iconColorClass: string;
  link?: string;
}

export default function DashboardPage() {
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);

  const summaryStats = useMemo(() => {
    const totalRevenue = mockSales
      .filter(s => s.status === 'Completed')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    
    const totalSales = mockSales.length;

    const pendingInvoices = mockInvoices.filter(
      i => i.status === 'Draft' || i.status === 'Sent' || i.status === 'Overdue'
    ).length;

    const lowStockItems = mockProducts.filter(
      p => p.stock <= (p.lowStockThreshold || 0)
    ).length;

    return {
      totalRevenue,
      totalSales,
      pendingInvoices,
      lowStockItems,
    };
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  useEffect(() => {
    const salesActivities: DashboardActivity[] = mockSales.map(s => ({
      id: `sale-${s.id}`,
      date: new Date(s.createdAt || s.saleDate), 
      type: 'Sale',
      title: `Sale #${s.id.split('_')[1]}`,
      subtitle: `Customer: ${s.customer.name}`,
      amount: s.totalAmount,
      icon: ShoppingCart,
      iconColorClass: 'text-green-500',
      link: `/sales/${s.id}`
    }));

    const invoiceActivities: DashboardActivity[] = mockInvoices.map(i => ({
      id: `invoice-${i.id}`,
      date: new Date(i.createdAt || i.issueDate),
      type: 'Invoice',
      title: `Invoice ${i.invoiceNumber}`,
      subtitle: `Status: ${i.status}`,
      amount: i.totalAmount,
      icon: FileText,
      iconColorClass: 'text-blue-500',
      link: `/invoices/${i.id}`
    }));

    const productActivities: DashboardActivity[] = mockProducts.map(p => ({
      id: `product-${p.id}`,
      date: new Date(p.createdAt),
      type: 'Product Added',
      title: 'Product Added',
      subtitle: p.name,
      icon: p.stock > (p.lowStockThreshold || 0) ? Package : AlertCircle,
      iconColorClass: p.stock > (p.lowStockThreshold || 0) ? 'text-orange-500' : 'text-red-500',
      link: `/products/${p.id}/edit` 
    }));

    const combined = [...salesActivities, ...invoiceActivities, ...productActivities]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5); 

    setRecentActivities(combined);
  }, []);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</div>
            {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{summaryStats.totalSales}</div>
            {/* <p className="text-xs text-muted-foreground">+180.1% from last month</p> */}
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
              <p className="text-sm text-muted-foreground">No recent activities found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

