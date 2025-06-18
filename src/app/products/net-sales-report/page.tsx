
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, BarChart3, CalendarDays } from 'lucide-react';
import type { Sale, CreditNote, SaleItem as CreditNoteSaleItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DatePickerComponent } from '@/components/ui/date-picker';
import { format, startOfDay, endOfDay, isValid, parseISO } from 'date-fns';

interface AggregatedProductSaleData {
  productName: string;
  netQuantitySold: number;
}

export default function NetSalesReportPage() {
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [allCreditNotes, setAllCreditNotes] = useState<CreditNote[]>([]);
  
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [isLoadingCreditNotes, setIsLoadingCreditNotes] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  const parseApiDateString = useCallback((dateInput: string | Date | undefined | null, fieldNameForLog: string = "date"): Date | null => {
    if (!dateInput) {
      console.warn(`[NetSales Rpt DateParse] Null or undefined date provided for ${fieldNameForLog}.`);
      return null;
    }
    if (dateInput instanceof Date) {
      return isValid(dateInput) ? dateInput : null;
    }
    
    const dateString = String(dateInput).trim();
    if (dateString === "0000-00-00 00:00:00" || dateString === "0000-00-00") {
        console.warn(`[NetSales Rpt DateParse] Invalid zero-date for ${fieldNameForLog}: "${dateString}". Returning null.`);
        return null; 
    }

    // Try ISO parsing with 'T' separator
    let parsed = parseISO(dateString.replace(" ", "T"));
    if (isValid(parsed)) return parsed;

    // Try direct ISO parsing (if it's already in correct format)
    parsed = parseISO(dateString);
    if (isValid(parsed)) return parsed;
    
    console.warn(`[NetSales Rpt DateParse] Failed to parse ${fieldNameForLog} string: "${dateString}". Returning null.`);
    return null;
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoadingSales(true);
    setIsLoadingCreditNotes(true);
    setIsRefreshing(true);
    console.log("[NetSales Rpt Fetch] Starting data fetch (Sales & Credit Notes)...");

    try {
      const [salesRes, creditNotesRes] = await Promise.all([
        fetch("https://sajfoods.net/busa-api/database/get_sales.php"),
        fetch("https://sajfoods.net/busa-api/database/get_credit_notes.php")
      ]);
      
      // Process Sales
      if (!salesRes.ok) throw new Error(`Sales fetch failed: ${salesRes.status}`);
      const salesResult = await salesRes.json();
      console.log("[NetSales Rpt Fetch] Raw Sales API Response:", salesResult);
      if (salesResult.success && Array.isArray(salesResult.data)) {
        const parsedSales = salesResult.data.map((s_raw:any, index: number) => {
          const s = s_raw as any;
          const saleDate = parseApiDateString(s.saleDate, `sale.saleDate (ID: ${s.id || index})`);
          const items = Array.isArray(s.items) 
            ? s.items.map((si:any) => ({
                ...si, 
                quantity: Number(si.quantity || 0), 
                unitPrice: Number(si.unitPrice || 0), 
                totalPrice: Number(si.totalPrice || 0)
              })) 
            : [];
          if (items.length === 0 && Array.isArray(s.items) && s.items.length > 0) {
            console.warn(`[NetSales Rpt Fetch] Sale ID ${s.id || index} had items, but parsed to empty. Original:`, s.items);
          }
          return {
            ...s,
            saleDate: saleDate, // Can be null if parsing failed
            items: items
          };
        });
        setAllSales(parsedSales);
        console.log(`[NetSales Rpt Fetch] Processed ${parsedSales.length} sales.`);
      } else {
        toast({ title: "Error Loading Sales", description: salesResult?.message || "Could not load sales data.", variant: "destructive" });
        setAllSales([]);
      }
      setIsLoadingSales(false);

      // Process Credit Notes
      if (!creditNotesRes.ok) throw new Error(`Credit Notes fetch failed: ${creditNotesRes.status}`);
      const creditNotesResult = await creditNotesRes.json();
      console.log("[NetSales Rpt Fetch] Raw Credit Notes API Response:", creditNotesResult);
      if (creditNotesResult.success && Array.isArray(creditNotesResult.data)) {
        const parsedCreditNotes = creditNotesResult.data.map((cn_raw:any, index: number) => {
          const cn = cn_raw as any;
          const creditNoteDate = parseApiDateString(cn.creditNoteDate, `cn.creditNoteDate (ID: ${cn.id || index})`);
          let items = [];
          if (Array.isArray(cn.items)) {
            items = cn.items.map((cni:any) => ({
                ...cni, 
                quantity: Number(cni.quantity || 0), 
                unitPrice: Number(cni.unitPrice || 0), 
                totalPrice: Number(cni.totalPrice || 0)
            }));
          } else if (typeof cn.items === 'string' && cn.items.trim() !== '' && cn.items.trim().toLowerCase() !== 'null' && cn.items.trim() !== "0") {
            try {
              const parsedItems = JSON.parse(cn.items);
              if (Array.isArray(parsedItems)) {
                items = parsedItems.map((cni:any) => ({
                    ...cni, 
                    quantity: Number(cni.quantity || 0),
                    unitPrice: Number(cni.unitPrice || 0), 
                    totalPrice: Number(cni.totalPrice || 0)
                }));
              } else {
                console.warn(`[NetSales Rpt Fetch] CN ID ${cn.id || index} items string parsed but was not an array:`, parsedItems);
              }
            } catch (e) {
              console.warn(`[NetSales Rpt Fetch] Failed to parse items string for CN ${cn.id || index}:`, e, `Original string: '${cn.items}'`);
            }
          }
          if (items.length === 0 && (Array.isArray(cn.items) && cn.items.length > 0 || (typeof cn.items === 'string' && cn.items.trim() !== '' && cn.items.trim().toLowerCase() !== 'null' && cn.items.trim() !== "0"))) {
             console.warn(`[NetSales Rpt Fetch] CN ID ${cn.id || index} had item data, but parsed to empty. Original:`, cn.items);
          }
          return {
            ...cn,
            creditNoteDate: creditNoteDate, // Can be null
            amount: Number(cn.amount || 0),
            items: items
          };
        });
        setAllCreditNotes(parsedCreditNotes);
        console.log(`[NetSales Rpt Fetch] Processed ${parsedCreditNotes.length} credit notes.`);
      } else {
        toast({ title: "Error Loading Credit Notes", description: creditNotesResult?.message || "Could not load credit notes.", variant: "destructive" });
        setAllCreditNotes([]);
      }
      setIsLoadingCreditNotes(false);

    } catch (error: any) {
      console.error("[NetSales Rpt Fetch] Overall fetch error:", error);
      toast({ title: 'Error Fetching Report Data', description: error.message, variant: 'destructive' });
      setAllSales([]); setAllCreditNotes([]);
      setIsLoadingSales(false); setIsLoadingCreditNotes(false);
    } finally {
      setIsRefreshing(false);
      console.log("[NetSales Rpt Fetch] Data fetch attempt completed.");
    }
  }, [toast, parseApiDateString]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isOverallLoading = isLoadingSales || isLoadingCreditNotes;

  const aggregatedReportData: AggregatedProductSaleData[] = useMemo(() => {
    console.log(`[NetSales Rpt Agg] Recalculating. Sales: ${allSales.length}, CN: ${allCreditNotes.length}. From: ${fromDate}, To: ${toDate}, Search: "${searchTerm}", Overall Loading: ${isOverallLoading}`);
    
    if (isOverallLoading && allSales.length === 0 && allCreditNotes.length === 0) {
        console.log("[NetSales Rpt Agg] Still loading initial data, returning empty array.");
        return [];
    }

    const productQuantities = new Map<string, number>();

    allSales.forEach(sale => {
      const saleDate = sale.saleDate; 
      if (!saleDate || !isValid(saleDate)) {
        // console.warn(`[NetSales Rpt Agg] Skipping Sale ID ${sale.id} due to invalid/null date:`, saleDate);
        return;
      }

      const isAfterFromDate = !fromDate || saleDate >= startOfDay(fromDate);
      const isBeforeToDate = !toDate || saleDate <= endOfDay(toDate);

      if (isAfterFromDate && isBeforeToDate) {
        // console.log(`[NetSales Rpt Agg] Processing Sale ID: ${sale.id}, Date: ${sale.saleDate}, Items Count: ${sale.items?.length || 0}`);
        (sale.items || []).forEach((item, itemIndex) => {
          if (item.productName && typeof item.productName === 'string') {
            // console.log(`  [NetSales Rpt Agg] Sale Item ${itemIndex}: ${item.productName}, Qty: ${item.quantity}`);
            const currentQty = productQuantities.get(item.productName) || 0;
            productQuantities.set(item.productName, currentQty + (Number(item.quantity) || 0));
          } else {
            // console.warn(`  [NetSales Rpt Agg] Sale Item ${itemIndex} for Sale ID ${sale.id} has missing/invalid productName:`, item);
          }
        });
      }
    });

    allCreditNotes.forEach(cn => {
      if (cn.reason !== 'Returned Goods' || !Array.isArray(cn.items) || cn.items.length === 0) return;

      const cnDate = cn.creditNoteDate;
      if (!cnDate || !isValid(cnDate)) {
        // console.warn(`[NetSales Rpt Agg] Skipping CN ID ${cn.id} due to invalid/null date:`, cnDate);
        return;
      }

      const isAfterFromDateCN = !fromDate || cnDate >= startOfDay(fromDate);
      const isBeforeToDateCN = !toDate || cnDate <= endOfDay(toDate);

      if (isAfterFromDateCN && isBeforeToDateCN) {
        // console.log(`[NetSales Rpt Agg] Processing CN ID: ${cn.id}, Date: ${cn.creditNoteDate}, Items Count: ${cn.items?.length || 0}`);
        cn.items.forEach((item: CreditNoteSaleItem, itemIndex) => { 
          if (item.productName && typeof item.productName === 'string') {
            // console.log(`  [NetSales Rpt Agg] CN Item ${itemIndex}: ${item.productName}, Qty Returned: ${item.quantity}`);
            const currentQty = productQuantities.get(item.productName) || 0;
            productQuantities.set(item.productName, currentQty - (Number(item.quantity) || 0));
          } else {
            // console.warn(`  [NetSales Rpt Agg] CN Item ${itemIndex} for CN ID ${cn.id} has missing/invalid productName:`, item);
          }
        });
      }
    });
    
    let aggregatedArray = Array.from(productQuantities, ([productName, netQuantitySold]) => ({
      productName,
      netQuantitySold
    }));

    if (searchTerm) {
        aggregatedArray = aggregatedArray.filter(p => 
            p.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    aggregatedArray.sort((a, b) => a.productName.localeCompare(b.productName));

    console.log(`[NetSales Rpt Agg] Aggregated data points: ${aggregatedArray.length}. First few:`, aggregatedArray.slice(0,3));
    return aggregatedArray;

  }, [allSales, allCreditNotes, fromDate, toDate, searchTerm, isOverallLoading, parseApiDateString]);


  const handleRefresh = () => {
    fetchData(); 
    toast({title: "Refreshed", description: "Net sales report data updated."});
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const overallTotalNetQuantitySold = useMemo(() => 
    aggregatedReportData.reduce((sum, p) => sum + p.netQuantitySold, 0),
  [aggregatedReportData]);


  if (isOverallLoading && allSales.length === 0 && allCreditNotes.length === 0 && !isRefreshing) {
    return <div className="flex items-center justify-center h-full"><RefreshCw className="h-8 w-8 animate-spin mr-2"/>Loading report data...</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex items-center justify-between pb-4 border-b">
        <h1 className="text-2xl font-semibold flex items-center">
          <BarChart3 className="mr-3 h-6 w-6" /> Net Sales Quantity Report
        </h1>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || isOverallLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-muted-foreground"/> Date Range Filter</CardTitle>
          <CardDescription>Select a date range to view net sales quantity within that period.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fromDate" className="text-sm font-medium block mb-1">From Date</label>
            <DatePickerComponent date={fromDate} setDate={setFromDate} placeholder="Start date" />
          </div>
          <div>
            <label htmlFor="toDate" className="text-sm font-medium block mb-1">To Date</label>
            <DatePickerComponent date={toDate} setDate={setToDate} placeholder="End date" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Summary for Selected Period</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Net Quantity Sold (All Products)</p>
                <p className="text-2xl font-bold">{(isOverallLoading && aggregatedReportData.length === 0) ? <RefreshCw className="h-5 w-5 animate-spin inline" /> : overallTotalNetQuantitySold.toLocaleString()}</p>
            </div>
             <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Unique Products Sold (Net)</p>
                <p className="text-2xl font-bold">{(isOverallLoading && aggregatedReportData.length === 0) ? <RefreshCw className="h-5 w-5 animate-spin inline" /> : aggregatedReportData.length.toLocaleString()}</p>
            </div>
        </CardContent>
      </Card>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Product Sales Performance (Net Quantity)</CardTitle>
          <CardDescription>
            Net quantity sold (Sales - Returns) for each product name in the selected period.
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products by name..."
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
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Net Qty Sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isOverallLoading && aggregatedReportData.length === 0 && (allSales.length > 0 || allCreditNotes.length > 0) ? ( // Still processing, but some base data exists
                 <TableRow><TableCell colSpan={2} className="h-24 text-center"><RefreshCw className="h-6 w-6 animate-spin inline mr-2"/>Aggregating data...</TableCell></TableRow>
              ) : (!isOverallLoading && aggregatedReportData.length === 0 && (allSales.length > 0 || allCreditNotes.length > 0)) ? ( // Finished processing, but result is empty
                 <TableRow><TableCell colSpan={2} className="h-24 text-center">No sales data found for any products matching the current filters.</TableCell></TableRow>
              ) : (!isOverallLoading && allSales.length === 0 && allCreditNotes.length === 0) ? ( // No base data loaded at all
                 <TableRow><TableCell colSpan={2} className="h-24 text-center">No sales or credit note data loaded. Check connection or API.</TableCell></TableRow>
              ) : aggregatedReportData.map((productData) => {
                return (
                  <TableRow key={productData.productName}>
                    <TableCell className="font-medium">{productData.productName}</TableCell>
                    <TableCell className="text-right font-semibold">
                        {productData.netQuantitySold.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{aggregatedReportData.length}</strong> unique product names based on current filters.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

    
