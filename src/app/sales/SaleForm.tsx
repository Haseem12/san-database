
"use client";

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerComponent } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, Calendar as CalendarIcon, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Sale, SaleItem, Product, LedgerAccount, Invoice, UnitOfMeasure, PriceTier } from '@/types';
import { defaultCompanyDetails } from '@/types';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';


interface SaleFormProps {
  sale?: Sale;
  onSave: (sale: Sale, invoiceId: string) => void;
}

const newEmptyItem = (): Omit<SaleItem, 'productName' | 'unitPrice' | 'totalPrice'> & { productId: string; appliedPriceLevel?: string } => ({
  productId: '',
  quantity: 1,
  appliedPriceLevel: undefined,
});


export default function SaleForm({ sale: existingSale, onSave }: SaleFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [fetchedLedgerAccounts, setFetchedLedgerAccounts] = useState<LedgerAccount[]>([]);
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
  const [isLoadingLedgers, setIsLoadingLedgers] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(existingSale?.customer.id);
  const [selectedCustomer, setSelectedCustomer] = useState<LedgerAccount | null>(null);

  const [hasMounted, setHasMounted] = useState(false);
  const [saleDate, setSaleDate] = useState<Date | undefined>(undefined); // Initialize to undefined

  useEffect(() => {
    setHasMounted(true);
    if (existingSale?.saleDate) {
      setSaleDate(new Date(existingSale.saleDate));
    } else if (!saleDate) { // Only set for new sales if not already set
      setSaleDate(new Date());
    }
  }, [existingSale]); // Removed saleDate from dependency array to avoid loop if we always set it


  const [items, setItems] = useState<Array<Partial<SaleItem> & { productId: string; appliedPriceLevel?: string }>>(
    existingSale?.items.map(item => ({
      ...item,
      productId: item.productId,
      unitOfMeasure: item.unitOfMeasure as UnitOfMeasure | undefined,
      appliedPriceLevel: 'Standard Price' // Placeholder, will be recalculated
    })) || [newEmptyItem()]
  );

  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>(existingSale?.paymentMethod || 'Cash');
  const [notes, setNotes] = useState(existingSale?.notes || '');
  const [discountAmount, setDiscountAmount] = useState(existingSale?.discountAmount || 0);
  const TAX_RATE = 0.075;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("customer-products");


  const determinePriceDetails = useCallback((product: Product, customer: LedgerAccount | null): { price: number; appliedPriceLevel: string } => {
    if (!product) return { price: 0, appliedPriceLevel: 'N/A' };
    
    let productPriceTiers: PriceTier[] = [];
    // Ensure product.priceTiers is an array before trying to use .find on it
    if (Array.isArray(product.priceTiers)) {
        productPriceTiers = product.priceTiers;
    } else if (typeof product.priceTiers === 'string' && product.priceTiers.trim() !== '') {
        try {
            const parsed = JSON.parse(product.priceTiers);
            if (Array.isArray(parsed) && parsed.every(tier => typeof tier === 'object' && tier !== null && 'priceLevel' in tier && 'price' in tier)) {
                productPriceTiers = parsed;
            } else {
                 console.warn("Parsed priceTiers string for product", product.name, "is not a valid PriceTier[] during price determination. Received:", parsed);
            }
        } catch (e) { console.error("Failed to parse priceTiers string during price determination for product:", product.name, e); }
    } else if (product.priceTiers) { // If it exists but not array or parsable string
         console.warn("priceTiers for product", product.name, "is neither string nor valid array during price determination. Received:", typeof product.priceTiers, product.priceTiers);
    }


    if (!customer || !customer.priceLevel) {
        return { price: product.price, appliedPriceLevel: 'Standard Price' };
    }
    
    const priceLevelToUse = customer.priceLevel;
    const tieredPriceEntry = productPriceTiers.find(tier => tier.priceLevel === priceLevelToUse);
    
    if (tieredPriceEntry) {
        return { price: tieredPriceEntry.price, appliedPriceLevel: priceLevelToUse };
    } else {
        return { price: product.price, appliedPriceLevel: 'Standard Price (Fallback)' };
    }
  }, []);

  useEffect(() => {
    setIsLoadingLedgers(true);
    fetch('https://sajfoods.net/busa-api/database/getLedgerAccounts.php')
      .then(async res => {
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Raw error response (Ledger Accounts):", errorText);
            throw new Error(`HTTP error! Ledger Accounts status: ${res.status} - ${errorText.substring(0, 100)}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Fetched Ledger Accounts API Response:", data);
        if (data.success && Array.isArray(data.data)) {
          setFetchedLedgerAccounts(data.data);
        } else {
          toast({ title: "Error", description: `Failed to fetch ledger accounts: ${data.message || 'Unknown error or unexpected data format.'}`, variant: "destructive" });
          setFetchedLedgerAccounts([]);
        }
      })
      .catch(error => {
        console.error("Fetch Error (Ledger Accounts):", error);
        toast({ title: "Fetch Error", description: `Ledger accounts: ${error.message}`, variant: "destructive" });
        setFetchedLedgerAccounts([]);
      })
      .finally(() => setIsLoadingLedgers(false));

    setIsLoadingProducts(true);
    fetch('https://sajfoods.net/busa-api/database/get_products.php')
      .then(async res => {
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Raw error response (Products):", errorText);
            throw new Error(`HTTP error! Products status: ${res.status} - ${errorText.substring(0, 100)}`);
        }
        return res.json();
      })
      .then((data: Product[] | { success?: boolean; data?: Product[]; message?: string }) => {
        console.log("Fetched Products API Response:", data);
        let productsToSet: Product[] = [];
        if (Array.isArray(data)) { 
            productsToSet = data;
        } else if (data && typeof data === 'object' && 'success' in data && data.success === true && Array.isArray(data.data)) {
            productsToSet = data.data;
        } else if (data && typeof data === 'object' && 'message' in data) {
            console.error("Error fetching products from API (SaleForm):", (data as any).message);
            toast({ title: "Product Fetch Error", description: (data as any).message, variant: "destructive" });
        } else {
          console.error("Unexpected product data format (SaleForm):", data);
          toast({ title: "Error", description: `Failed to fetch products: Unexpected data format.`, variant: "destructive" });
        }
        
        const parsedProducts = productsToSet.map(p => {
            let finalPriceTiers: PriceTier[] = [];
            if (typeof p.priceTiers === 'string' && p.priceTiers.trim() !== '') {
                try {
                    const parsed = JSON.parse(p.priceTiers);
                    if (Array.isArray(parsed) && parsed.every(tier => typeof tier === 'object' && tier !== null && 'priceLevel' in tier && 'price' in tier)) {
                        finalPriceTiers = parsed;
                    } else {
                         console.warn("Parsed priceTiers string for product", p.name, "is not a valid PriceTier[] array after fetch. Received:", parsed);
                         finalPriceTiers = []; 
                    }
                } catch (e) { 
                  console.error("Failed to parse priceTiers for product during fetch:", p.name, p.priceTiers, e);
                  finalPriceTiers = []; 
                }
            } else if (Array.isArray(p.priceTiers) && p.priceTiers.every(tier => typeof tier === 'object' && tier !== null && 'priceLevel' in tier && 'price' in tier)) {
                finalPriceTiers = p.priceTiers;
            } else if (p.priceTiers && typeof p.priceTiers !== 'string' && !Array.isArray(p.priceTiers)) { 
                console.warn("priceTiers for product", p.name, "is neither string nor valid array after fetch. Initializing as empty. Received type:", typeof p.priceTiers, "Value:", p.priceTiers);
                finalPriceTiers = [];
            }
             else if (p.priceTiers === null || p.priceTiers === undefined) {
                finalPriceTiers = []; // Handle explicit null or undefined
            }
            return { ...p, priceTiers: finalPriceTiers };
        });
        console.log("Parsed Products for SaleForm:", parsedProducts);
        setFetchedProducts(parsedProducts);
      })
      .catch(error => {
        console.error("Fetch Error (Products - SaleForm):", error);
        toast({ title: "Fetch Error", description: `Products: ${error.message}`, variant: "destructive" });
        setFetchedProducts([]);
      })
      .finally(() => setIsLoadingProducts(false));
  }, [toast]);

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = fetchedLedgerAccounts.find(c => c.id === selectedCustomerId);
      setSelectedCustomer(customer || null);
       console.log("Selected Customer in SaleForm:", customer);
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, fetchedLedgerAccounts]);

  useEffect(() => {
    if (fetchedProducts.length > 0 && (selectedCustomer || !selectedCustomerId)) {
      setItems(prevItems => prevItems.map(item => {
        if (item.productId) {
          const product = fetchedProducts.find(p => p.id === item.productId);
          if (product) {
            const priceDetails = determinePriceDetails(product, selectedCustomer);
            return {
              ...item,
              unitPrice: priceDetails.price,
              totalPrice: priceDetails.price * (item.quantity || 1),
              unitOfMeasure: product.unitOfMeasure,
              appliedPriceLevel: priceDetails.appliedPriceLevel
            };
          }
        }
        return item;
      }));
    }
  }, [selectedCustomer, selectedCustomerId, fetchedProducts, determinePriceDetails]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleItemChange = (index: number, field: keyof SaleItem | 'productId' | 'appliedPriceLevel', value: string | number) => {
    const updatedItems = [...items];
    const currentItem = { ...updatedItems[index] } as Partial<SaleItem> & { productId: string; appliedPriceLevel?: string };

    if (field === 'productId') {
      currentItem.productId = value as string;
      const product = fetchedProducts.find(p => p.id === currentItem.productId);
      if (product) {
          currentItem.productName = product.name;
          currentItem.unitOfMeasure = product.unitOfMeasure;
          const priceDetails = determinePriceDetails(product, selectedCustomer);
          currentItem.unitPrice = priceDetails.price;
          currentItem.appliedPriceLevel = priceDetails.appliedPriceLevel;
      } else {
           currentItem.productName = ''; currentItem.unitPrice = 0; currentItem.unitOfMeasure = undefined; currentItem.appliedPriceLevel = undefined;
      }
    } else if (field === 'quantity') {
      currentItem.quantity = Number(value) || 0;
    }
    currentItem.totalPrice = (currentItem.unitPrice || 0) * (currentItem.quantity || 0);
    updatedItems[index] = currentItem;
    setItems(updatedItems);
  };

  const addItem = () => setItems([...items, newEmptyItem()]);
  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems.length > 0 ? updatedItems : [newEmptyItem()]);
  };

  const subTotal = useMemo(() => items.reduce((sum, item) => sum + (item.totalPrice || 0), 0), [items]);
  const calculatedDiscountAmount = discountAmount || 0;
  const taxAmount = useMemo(() => (subTotal - calculatedDiscountAmount) * TAX_RATE, [subTotal, calculatedDiscountAmount]);
  const totalAmount = useMemo(() => subTotal - calculatedDiscountAmount + taxAmount, [subTotal, calculatedDiscountAmount, taxAmount]);
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selectedCustomer || !saleDate || items.some(item => !item.productId || !item.quantity || item.quantity <= 0)) {
      toast({ title: "Missing Information", description: "Customer, sale date, and valid items are required.", variant: "destructive" });
      setIsSubmitting(false); return;
    }

    const finalSaleItems: SaleItem[] = [];
    let stockSufficient = true;
    for (const item of items) {
      const product = fetchedProducts.find(p => p.id === item.productId);
      if (!product) {
        toast({ title: "Error", description: `Product ${item.productName || item.productId} not found.`, variant: "destructive" });
        stockSufficient = false; break;
      }
      if (product.stock < (item.quantity || 0) && !existingSale) {
        toast({ title: "Insufficient Stock", description: `Not enough stock for ${product.name}. Available: ${product.stock}.`, variant: "destructive" });
        stockSufficient = false; break;
      }
      const priceDetails = determinePriceDetails(product, selectedCustomer);
      finalSaleItems.push({
        productId: item.productId!, productName: product.name, quantity: item.quantity!,
        unitPrice: priceDetails.price, totalPrice: priceDetails.price * item.quantity!, unitOfMeasure: product.unitOfMeasure!,
      });
    }
    if (!stockSufficient) { setIsSubmitting(false); return; }

    const clientInvoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const salePayload: any = {
      id: existingSale?.id, 
      saleDate: format(saleDate, "yyyy-MM-dd HH:mm:ss"),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name, 
      customerEmail: selectedCustomer.phone, 
      customerAddress: selectedCustomer.address, 
      customerPriceLevel: selectedCustomer.priceLevel, 
      items: finalSaleItems,
      subTotal,
      discountAmount: discountAmount > 0 ? discountAmount : null,
      taxAmount: taxAmount, 
      totalAmount,
      paymentMethod,
      status: (paymentMethod === 'Credit' && totalAmount > 0) ? 'Pending' : 'Completed', 
      notes: notes || null,
      createdAt: existingSale?.createdAt ? format(new Date(existingSale.createdAt), "yyyy-MM-dd HH:mm:ss") : format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      
      invoiceNumber: existingSale?.invoiceId ? undefined : clientInvoiceNumber, 
      invoiceDueDate: format(new Date(saleDate.getTime() + (selectedCustomer.creditPeriod || 15) * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      invoiceStatus: (paymentMethod === 'Cash' || paymentMethod === 'Card' || paymentMethod === 'Transfer' || paymentMethod === 'Online') ? 'Paid' : 'Sent',
      companyDetails: defaultCompanyDetails,
      existingInvoiceId: existingSale?.invoiceId 
    };
    
    console.log("Submitting Sale Payload:", JSON.stringify(salePayload, null, 2));


    try {
      const response = await fetch('https://sajfoods.net/busa-api/database/save_sale_and_invoice.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload),
      });

      if (!response.ok) {
        const errorText = await response.text(); 
        console.error("Server Response Error Text (Sale/Invoice):", errorText);
        throw new Error(`Server error: ${response.status} - ${errorText || response.statusText}`);
      }
      const result = await response.json();
      console.log("Save Sale and Invoice Response:", result);

      if (result.success && result.saleId && result.invoiceId) {
        if (!existingSale) {
          const updatedFetchedProducts = fetchedProducts.map(p => {
            const soldItem = finalSaleItems.find(si => si.productId === p.id);
            if (soldItem) return { ...p, stock: p.stock - soldItem.quantity };
            return p;
          });
          setFetchedProducts(updatedFetchedProducts);
        }

        const savedSaleDataForCallback = {
            ...salePayload, 
            id: result.saleId, 
            invoiceId: result.invoiceId, 
            saleDate: new Date(salePayload.saleDate),
            createdAt: new Date(salePayload.createdAt),
            updatedAt: new Date(salePayload.updatedAt),
            customer: { 
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                priceLevel: selectedCustomer.priceLevel
            }
        } as Sale; 
        onSave(savedSaleDataForCallback, result.invoiceId);

        toast({
          title: existingSale ? "Sale & Invoice Updated" : "Sale Recorded & Invoice Created",
          description: `Sale ID "${result.saleId}" and Invoice "${result.invoiceNumber || result.invoiceId}" processed.`,
        });
        router.push(`/invoices/${result.invoiceId}`);
      } else {
        console.error("PHP Script Error (Sale/Invoice):", result.message || "Unknown error from PHP script.");
        // Removed throw new Error here to let the toast handle it.
        toast({
            title: "Server Processing Error",
            description: result.message || "Failed to save sale/invoice. The server indicated an issue.",
            variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Full error object (Sale/Invoice):", error);
      toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <form id="sale-form" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{existingSale ? 'Edit Sale' : 'Record New Sale'}</CardTitle>
            <CardDescription>{existingSale ? `Editing sale ${existingSale.id}` : 'Fill in the details for the new sale.'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="customer-products">Customer & Products</TabsTrigger>
              <TabsTrigger value="payment-summary">Payment & Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="customer-products" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customer">Customer (Ledger Account) <span className="text-destructive">*</span></Label>
                  <Select onValueChange={handleCustomerChange} value={selectedCustomerId} required disabled={isLoadingLedgers}>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder={isLoadingLedgers ? "Loading Customers..." : "Select customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {fetchedLedgerAccounts?.filter(acc => ['Customer', 'Sales Rep', 'Premium Product', 'Standard Product'].includes(acc.accountType))
                        .map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.accountCode})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedCustomer && (
                    <div className="mt-2 text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                       <div className="font-medium">Selected: {selectedCustomer.name}</div>
                       <div>Price Level: <Badge variant="secondary" className="ml-1">{selectedCustomer.priceLevel}</Badge></div>
                       <div>Zone: <Badge variant="outline" className="ml-1">{selectedCustomer.zone}</Badge></div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="saleDate">Sale Date <span className="text-destructive">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !saleDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {hasMounted && saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={saleDate} onSelect={setSaleDate} initialFocus disabled={!hasMounted} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Card>
                <CardHeader><CardTitle>Sale Items</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                        <TableHead className="w-[30%]">Product</TableHead><TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead><TableHead>Applied Price Level</TableHead>
                        <TableHead className="text-right">Unit Price (NGN)</TableHead><TableHead className="text-right">Total (NGN)</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.productId || ""}
                              onValueChange={(value) => handleItemChange(index, 'productId', value)}
                              disabled={!selectedCustomer || isLoadingProducts}
                            >
                              <SelectTrigger><SelectValue placeholder={isLoadingProducts ? "Loading Products..." : "Select product"} /></SelectTrigger>
                              <SelectContent>
                                {fetchedProducts?.filter(p => p.id && String(p.id).trim() !== '').map(p => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} ({p.unitOfMeasure}
                                    {p.litres ? ` - ${p.litres}L` : ''})
                                    - Stock: {p.stock ?? 'N/A'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!selectedCustomer && index === 0 && <div className="text-xs text-destructive mt-1">Select customer first.</div>}
                          </TableCell>
                          <TableCell><Input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1" disabled={!item.productId}/></TableCell>
                          <TableCell>{item.unitOfMeasure || 'N/A'}</TableCell>
                          <TableCell><Badge variant={item.appliedPriceLevel === 'Standard Price' || item.appliedPriceLevel === 'Standard Price (Fallback)' ? 'outline' : 'default'}>{item.appliedPriceLevel || 'N/A'}</Badge></TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice || 0)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalPrice || 0)}</TableCell>
                          <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-4" disabled={!selectedCustomer || isLoadingProducts}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payment-summary" className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle>Payment & Notes</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select onValueChange={(value: Sale['paymentMethod']) => setPaymentMethod(value)} value={paymentMethod}>
                          <SelectTrigger id="paymentMethod"><SelectValue placeholder="Select method" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem><SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Transfer">Bank Transfer</SelectItem><SelectItem value="Online">Online Payment</SelectItem>
                            <SelectItem value="Credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label htmlFor="notes">Notes (Optional)</Label><Textarea id="notes" placeholder="Instructions or notes..." value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Sale Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between"><Label>Subtotal:</Label><span>{formatCurrency(subTotal)}</span></div>
                      <div className="flex justify-between items-center">
                        <Label htmlFor="discountAmount">Discount (NGN):</Label>
                        <Input id="discountAmount" type="number" value={discountAmount} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} className="w-32 text-right" placeholder="0.00" min="0"/>
                      </div>
                      <div className="flex justify-between"><Label>Tax ({(TAX_RATE * 100).toFixed(1)}%):</Label><span>{formatCurrency(taxAmount)}</span></div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><Label>Total Amount:</Label><span>{formatCurrency(totalAmount)}</span></div>
                    </CardContent>
                  </Card>
              </div>
            </TabsContent>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting || isLoadingLedgers || isLoadingProducts}>Cancel</Button>
            <Button type="submit" disabled={!hasMounted || isSubmitting || isLoadingLedgers || isLoadingProducts || !selectedCustomer || items.some(item => !item.productId || !item.quantity || item.quantity <= 0) }>
              {isSubmitting ? (existingSale ? 'Updating...' : 'Processing...') : (existingSale ? 'Save Changes' : 'Record Sale & Create Invoice')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Tabs>
  );
}

