
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerComponent } from "@/components/ui/date-picker";
import { useToast } from '@/hooks/use-toast';
import type { ProductStockAdjustmentLog, ProductStockAdjustmentType, UnitOfMeasure, Product as ProductType, ProductCategory } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface StockAdditionItem {
  id: string; 
  productId: string | undefined;
  productName: string; 
  currentStock: number; 
  unitOfMeasure: string; 
  quantityToAdd: number;
}

const createNewStockAdditionItem = (): StockAdditionItem => ({
  id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  productId: undefined,
  productName: 'N/A',
  currentStock: 0,
  unitOfMeasure: 'N/A',
  quantityToAdd: 0,
});

export default function AddStockLogForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [availableProducts, setAvailableProducts] = useState<ProductType[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [batchLogNumber, setBatchLogNumber] = useState(
    `STKBTCH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}`
  );
  const [items, setItems] = useState<StockAdditionItem[]>([createNewStockAdditionItem()]);
  const [adjustmentDate, setAdjustmentDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const adjustmentType: ProductStockAdjustmentType = 'ADDITION';

  useEffect(() => {
    setIsLoadingProducts(true);
    console.log("[AddStockLogForm] Initiating product fetch from: https://sajfoods.net/busa-api/database/get_products.php");
    fetch('https://sajfoods.net/busa-api/database/get_products.php')
      .then(async (res) => {
        const responseText = await res.text(); 
        console.log("[AddStockLogForm] Raw product response text (first 500 chars):", responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""));

        if (!res.ok) {
          console.error("[AddStockLogForm] Products fetch HTTP error: " + res.status + ". Response snippet: " + responseText.substring(0, 200));
          throw new Error(`Products fetch failed with status ${res.status}. Server response may not be JSON. Check network tab for details. Response snippet: ${responseText.substring(0,100)}`);
        }

        let jsonData;
        try {
          jsonData = JSON.parse(responseText); 
        } catch (e: any) {
          console.error("[AddStockLogForm] Failed to parse products JSON. Error: ", e.message, "Raw Response was: " + responseText.substring(0, 200));
          throw new Error("Invalid JSON response from server for products. Server might have returned an error page (e.g., HTML). Check console for raw response.");
        }
        console.log("[AddStockLogForm] Successfully parsed product JSON data:", jsonData);
        return jsonData;
      })
      .then((data: any) => { 
        let productsToSet: any[] = []; 
        if (Array.isArray(data)) {
          productsToSet = data;
        } else if (data && data.success === true && Array.isArray(data.data)) {
          productsToSet = data.data;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
            console.warn("[AddStockLogForm] Product data received in object but 'success' flag might be missing/false. Using 'data' array.", data);
            productsToSet = data.data;
        } else {
          const errorMsg = (data && typeof data === 'object' && data.message) ? data.message : "Could not load products: Unexpected data format after JSON parse.";
          console.error("[AddStockLogForm] Product data error after parse:", errorMsg, "Original data object:", data);
          toast({ title: "Error Loading Products", description: errorMsg, variant: "destructive" });
          setAvailableProducts([]);
          setIsLoadingProducts(false);
          return;
        }
        
        console.log(`[AddStockLogForm] productsToSet array (length: ${productsToSet.length}) before mapping (first 3 raw):`, productsToSet.slice(0,3));

        const mappedProducts = productsToSet.map((p_raw: any, index: number) => {
          if (!p_raw || typeof p_raw !== 'object') {
            console.warn(`[AddStockLogForm] Invalid product data at index ${index}: not an object. Skipping. Value:`, p_raw);
            return null;
          }

          const id = String(p_raw.id || `fallback_id_${Date.now()}_${index}`);
          if (!p_raw.id) console.warn(`[AddStockLogForm] Product at index ${index} missing ID. Using fallback: ${id}`, p_raw);
          
          const name = String(p_raw.name || 'Unnamed Product');
          if (!p_raw.name) console.warn(`[AddStockLogForm] Product at index ${index} missing name. Using fallback: ${name}`, p_raw);
          
          let priceTiers = [];
          if (Array.isArray(p_raw.priceTiers)) {
            priceTiers = p_raw.priceTiers;
          } else if (typeof p_raw.priceTiers === 'string' && p_raw.priceTiers.trim() !== '' && p_raw.priceTiers !== "0") {
            try {
              const parsed = JSON.parse(p_raw.priceTiers);
              if(Array.isArray(parsed)) priceTiers = parsed;
            } catch (e) { console.warn(`[AddStockLogForm] Failed to parse priceTiers for product ${name}:`, e); }
          }

          return {
            id: id,
            name: name,
            sku: String(p_raw.sku || 'N/A'),
            stock: Number(p_raw.stock || 0),
            unitOfMeasure: String(p_raw.unitOfMeasure || 'PCS') as UnitOfMeasure,
            description: String(p_raw.description || ''),
            price: Number(p_raw.price || 0),
            costPrice: Number(p_raw.costPrice || 0),
            priceTiers: priceTiers,
            productCategory: String(p_raw.productCategory || 'Other Finished Good') as ProductCategory,
            alternateUnits: String(p_raw.alternateUnits || ''),
            pcsPerUnit: Number(p_raw.pcsPerUnit || 0),
            litres: Number(p_raw.litres || 0),
            lowStockThreshold: Number(p_raw.lowStockThreshold || 10),
            imageUrl: String(p_raw.imageUrl || ''),
            createdAt: p_raw.createdAt ? new Date(String(p_raw.createdAt).replace(" ", "T")) : new Date(0),
            updatedAt: p_raw.updatedAt ? new Date(String(p_raw.updatedAt).replace(" ", "T")) : new Date(0),
          };
        }).filter(p => p !== null) as ProductType[];

        console.log(`[AddStockLogForm] Final mapped products (length: ${mappedProducts.length}) after filtering nulls (first 3):`, mappedProducts.slice(0,3));
        setAvailableProducts(mappedProducts);
      })
      .catch(error => {
        console.error("[AddStockLogForm] Final catch block during product fetch/processing:", error.message);
        let toastMessage = `Products: ${error.message}`;
        if (error.message && error.message.toLowerCase().includes("failed to fetch")) {
            toastMessage = "Failed to fetch products. Please check your network connection, ensure the server at 'sajfoods.net' is reachable, and that CORS is configured correctly on the server if the domains differ.";
        }
        toast({ title: "Fetch Error", description: toastMessage, variant: "destructive" });
        setAvailableProducts([]);
      })
      .finally(() => {
        setIsLoadingProducts(false);
        console.log("[AddStockLogForm] Product fetching process completed.");
      });
  }, [toast]);

  const handleAddItemRow = () => {
    setItems([...items, createNewStockAdditionItem()]);
  };

  const handleRemoveItemRow = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof StockAdditionItem, value: string | number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'productId') {
          const selectedProduct = availableProducts.find(p => p.id === value);
          if (selectedProduct) {
            updatedItem.productName = selectedProduct.name;
            updatedItem.currentStock = selectedProduct.stock;
            updatedItem.unitOfMeasure = selectedProduct.unitOfMeasure;
            updatedItem.quantityToAdd = 0; 
          } else {
            updatedItem.productName = 'N/A';
            updatedItem.currentStock = 0;
            updatedItem.unitOfMeasure = 'N/A';
          }
        }
        if (field === 'quantityToAdd') {
            updatedItem.quantityToAdd = Number(value) || 0;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const validItems = items.filter(item => item.productId && item.quantityToAdd > 0);

    if (validItems.length === 0) {
      toast({ title: "Error", description: "Please add at least one product with a quantity greater than zero.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!adjustmentDate) {
      toast({ title: "Error", description: "Please select an adjustment date.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const batchStockLogPayloads = validItems.map((item, index) => {
        return {
            logNumber: `${batchLogNumber}-ITEM-${index + 1}`, 
            productId: item.productId!,
            productName: item.productName,
            quantityAdjusted: Number(item.quantityToAdd),
            adjustmentType,
            adjustmentDate: format(adjustmentDate, "yyyy-MM-dd HH:mm:ss"),
            notes: `Batch: ${batchLogNumber}. ${notes || ''}`.trim(),
            previousStock: Number(item.currentStock),
            newStock: Number(item.currentStock) + Number(item.quantityToAdd),
            createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        };
    });
    
    const overallPayload = {
        batchLogNumber: batchLogNumber, 
        items: batchStockLogPayloads,
    };

    console.log("[AddStockLogForm] Submitting payload:", JSON.stringify(overallPayload, null, 2));

    try {
      const response = await fetch('https://sajfoods.net/busa-api/database/save_product_stock_log_batch.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overallPayload), 
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Failed to read error from server.");
        console.error("[AddStockLogForm] Server error response text:", errorText.substring(0, 500));
        throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      const result = await response.json();
      console.log("[AddStockLogForm] Server response:", result);

      if (result.success) {
        toast({
          title: "Stock Added Successfully",
          description: `${validItems.length} product(s) had stock levels updated. Batch Ref: ${batchLogNumber}`,
        });
        router.push('/products/stock-management/log'); 
      } else {
        throw new Error(result.message || "Failed to save batch stock adjustment log.");
      }
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6 items-end">
        <div>
          <Label htmlFor="batchLogNumber">Batch Reference ID</Label>
          <Input id="batchLogNumber" value={batchLogNumber} onChange={e => setBatchLogNumber(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="adjustmentDate">Adjustment Date <span className="text-destructive">*</span></Label>
          <DatePickerComponent date={adjustmentDate} setDate={setAdjustmentDate} />
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Product</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="w-[20%]">Quantity to Add</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Select
                  value={item.productId || ""}
                  onValueChange={(value) => handleItemChange(item.id, 'productId', value)}
                  disabled={isLoadingProducts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select product"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.length > 0 ? availableProducts.map(p => (
                      <SelectItem key={p.id} value={p.id} disabled={items.some(i => i.productId === p.id && i.id !== item.id)}>
                        {p.name} ({p.sku || 'No SKU'}) - Stock: {p.stock}
                      </SelectItem>
                    )) : <SelectItem value="no-products" disabled>No products available or failed to load</SelectItem>}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input value={item.currentStock} readOnly disabled className="bg-muted/50"/>
              </TableCell>
              <TableCell>
                <Input value={item.unitOfMeasure} readOnly disabled className="bg-muted/50"/>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantityToAdd}
                  onChange={(e) => handleItemChange(item.id, 'quantityToAdd', e.target.value)}
                  min="0"
                  step="any"
                  disabled={!item.productId}
                  className="border-green-500 focus:ring-green-500"
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItemRow(item.id)}
                  disabled={items.length === 1 && !item.productId}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow} disabled={isLoadingProducts}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Another Product
      </Button>

      <div>
        <Label htmlFor="notes">Reason / Notes for Batch (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g., Weekly stock replenishment, Production batch XYZ completion"
        />
      </div>
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || isLoadingProducts || items.every(item => !item.productId || item.quantityToAdd <= 0) || !adjustmentDate}>
          {isLoading ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Recording Batch...</> : 'Record Batch Stock Addition'}
        </Button>
      </div>
    </form>
  );
}

