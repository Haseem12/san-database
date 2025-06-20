
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerComponent } from "@/components/ui/date-picker";
import { useToast } from '@/hooks/use-toast';
import type { ProductStockAdjustmentLog, ProductStockAdjustmentType, UnitOfMeasure, Product as ProductType, ProductCategory } from '@/types';
import { productStockAdjustmentTypes } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, RefreshCw } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

interface StockOperationItem {
  id: string; 
  productId: string | undefined;
  productName: string; 
  currentStock: number; 
  unitOfMeasure: string; 
  quantityToAdjust: number; // Renamed from quantityToAdd
}

interface ProductStockLogFormProps {
  isEditMode?: boolean;
  existingLogEntry?: ProductStockAdjustmentLog;
  onSaveSuccess?: () => void; // Optional: if parent page needs to know about save
}

const createNewStockOperationItem = (): StockOperationItem => ({
  id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  productId: undefined,
  productName: 'N/A',
  currentStock: 0,
  unitOfMeasure: 'N/A',
  quantityToAdjust: 0,
});

export default function ProductStockLogForm({ 
  isEditMode = false, 
  existingLogEntry,
  onSaveSuccess
}: ProductStockLogFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [availableProducts, setAvailableProducts] = useState<ProductType[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [batchLogNumber, setBatchLogNumber] = useState(
    existingLogEntry?.logNumber || `STKBTCH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}`
  );
  // For edit mode, items will be a single item array pre-filled.
  const [items, setItems] = useState<StockOperationItem[]>(
    isEditMode && existingLogEntry
      ? [{
          id: existingLogEntry.id,
          productId: existingLogEntry.productId,
          productName: existingLogEntry.productName,
          currentStock: existingLogEntry.previousStock, // Or fetch live stock if preferred
          unitOfMeasure: availableProducts.find(p => p.id === existingLogEntry.productId)?.unitOfMeasure || 'N/A',
          quantityToAdjust: existingLogEntry.quantityAdjusted,
        }]
      : [createNewStockOperationItem()]
  );
  const [adjustmentType, setAdjustmentType] = useState<ProductStockAdjustmentType>(
    existingLogEntry?.adjustmentType || 'ADDITION'
  );
  const [adjustmentDate, setAdjustmentDate] = useState<Date | undefined>(
    existingLogEntry?.adjustmentDate ? (typeof existingLogEntry.adjustmentDate === 'string' ? parseISO(existingLogEntry.adjustmentDate) : existingLogEntry.adjustmentDate as Date) : new Date()
  );
  const [notes, setNotes] = useState(existingLogEntry?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsLoadingProducts(true);
    fetch('https://sajfoods.net/busa-api/database/get_products.php')
      .then(async (res) => {
        const responseText = await res.text();
        if (!res.ok) {
          throw new Error(`Products fetch failed with status ${res.status}. Server response snippet: ${responseText.substring(0,100)}`);
        }
        let jsonData;
        try { jsonData = JSON.parse(responseText); } 
        catch (e: any) { throw new Error("Invalid JSON response from server for products. Raw Response: " + responseText.substring(0, 200));}
        return jsonData;
      })
      .then((data: any) => {
        let productsToSet: any[] = [];
        if (Array.isArray(data)) productsToSet = data;
        else if (data && data.success === true && Array.isArray(data.data)) productsToSet = data.data;
        else if (data && typeof data === 'object' && Array.isArray(data.data)) productsToSet = data.data;
        else {
          const errorMsg = (data && typeof data === 'object' && data.message) ? data.message : "Could not load products: Unexpected data format.";
          throw new Error(errorMsg);
        }
        
        const mappedProducts = productsToSet.map((p_raw: any, index: number) => {
          if (!p_raw || typeof p_raw !== 'object') return null;
          const id = String(p_raw.id || `fallback_id_${Date.now()}_${index}`);
          const name = String(p_raw.name || 'Unnamed Product');
          let priceTiers = [];
          if (Array.isArray(p_raw.priceTiers)) priceTiers = p_raw.priceTiers;
          else if (typeof p_raw.priceTiers === 'string' && p_raw.priceTiers.trim() !== '' && p_raw.priceTiers !== "0") {
            try { const parsed = JSON.parse(p_raw.priceTiers); if(Array.isArray(parsed)) priceTiers = parsed; } 
            catch (e) { /* ignore */ }
          }
          return {
            id: id, name: name, sku: String(p_raw.sku || 'N/A'), stock: Number(p_raw.stock || 0),
            unitOfMeasure: String(p_raw.unitOfMeasure || 'PCS') as UnitOfMeasure,
            description: String(p_raw.description || ''), price: Number(p_raw.price || 0),
            costPrice: Number(p_raw.costPrice || 0), priceTiers: priceTiers,
            productCategory: String(p_raw.productCategory || 'Other Finished Good') as ProductCategory,
            alternateUnits: String(p_raw.alternateUnits || ''), pcsPerUnit: Number(p_raw.pcsPerUnit || 0),
            litres: Number(p_raw.litres || 0), lowStockThreshold: Number(p_raw.lowStockThreshold || 10),
            imageUrl: String(p_raw.imageUrl || ''),
            createdAt: p_raw.createdAt ? new Date(String(p_raw.createdAt).replace(" ", "T")) : new Date(0),
            updatedAt: p_raw.updatedAt ? new Date(String(p_raw.updatedAt).replace(" ", "T")) : new Date(0),
          };
        }).filter(p => p !== null) as ProductType[];
        setAvailableProducts(mappedProducts);

        // If in edit mode and existingLogEntry is set, update the item's unitOfMeasure and currentStock
        if (isEditMode && existingLogEntry) {
            const product = mappedProducts.find(p => p.id === existingLogEntry.productId);
            if (product) {
                setItems(prev => [{
                    ...prev[0], // Assuming only one item for edit mode
                    unitOfMeasure: product.unitOfMeasure,
                    currentStock: product.stock, // Potentially outdated if stock changed since log creation.
                                                 // For accuracy, might need to fetch current stock again, or base "previous stock" on the log's value.
                                                 // For simplicity here, we use the product's current stock from the list.
                }]);
            }
        }

      })
      .catch(error => {
        let toastMessage = `Products: ${error.message}`;
        if (error.message && error.message.toLowerCase().includes("failed to fetch")) {
            toastMessage = "Failed to fetch products. Please check your network connection, ensure the server at 'sajfoods.net' is reachable, and that CORS is configured correctly on the server if the domains differ.";
        }
        toast({ title: "Fetch Error", description: toastMessage, variant: "destructive" });
        setAvailableProducts([]);
      })
      .finally(() => setIsLoadingProducts(false));
  }, [toast, isEditMode, existingLogEntry?.productId]); // existingLogEntry added to dependencies

  const handleAddItemRow = () => {
    setItems([...items, createNewStockOperationItem()]);
  };

  const handleRemoveItemRow = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof StockOperationItem, value: string | number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'productId') {
          const selectedProduct = availableProducts.find(p => p.id === value);
          if (selectedProduct) {
            updatedItem.productName = selectedProduct.name;
            updatedItem.currentStock = selectedProduct.stock; // This is current stock, not necessarily previous stock for the log
            updatedItem.unitOfMeasure = selectedProduct.unitOfMeasure;
            if (!isEditMode) updatedItem.quantityToAdjust = 0; // Reset quantity for new selections in add mode
          } else {
            updatedItem.productName = 'N/A'; updatedItem.currentStock = 0; updatedItem.unitOfMeasure = 'N/A';
          }
        }
        if (field === 'quantityToAdjust') {
            updatedItem.quantityToAdjust = Number(value) || 0;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!adjustmentDate) {
      toast({ title: "Error", description: "Please select an adjustment date.", variant: "destructive" });
      setIsLoading(false); return;
    }

    if (isEditMode && existingLogEntry) {
      // Handle single item edit
      const itemToEdit = items[0];
      if (!itemToEdit || !itemToEdit.productId || itemToEdit.quantityToAdjust === 0) {
        toast({ title: "Error", description: "Product and a non-zero quantity are required for editing.", variant: "destructive" });
        setIsLoading(false); return;
      }
      
      const productDetails = availableProducts.find(p => p.id === itemToEdit.productId);
      const originalQuantity = existingLogEntry.quantityAdjusted;

      const payload: any = {
        id: existingLogEntry.id, // The ID of the log entry to update
        logNumber: batchLogNumber, // Could be existingLogEntry.logNumber
        productId: itemToEdit.productId,
        productName: itemToEdit.productName,
        quantityAdjusted: Number(itemToEdit.quantityToAdjust),
        originalQuantity: originalQuantity, // Send original quantity for backend to calculate diff
        adjustmentType: adjustmentType, // Send the current adjustment type
        adjustmentDate: format(adjustmentDate, "yyyy-MM-dd HH:mm:ss"),
        notes: notes,
        // previousStock will be based on the *original* log's previousStock,
        // or recalculated on backend based on current stock and original log's effect.
        // newStock will be recalculated on backend.
      };
      console.log("Submitting Edit Payload:", JSON.stringify(payload, null, 2));
      try {
        const response = await fetch('https://sajfoods.net/busa-api/database/update_product_stock_log.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorText = await response.text(); throw new Error(`Server error: ${response.status} - ${errorText.substring(0,100)}`);
        }
        const result = await response.json();
        if (result.success) {
            toast({ title: "Stock Log Updated", description: `Log entry ${existingLogEntry.logNumber} updated successfully.` });
            if (onSaveSuccess) onSaveSuccess(); else router.push('/products/stock-management/log');
        } else { throw new Error(result.message || "Failed to update stock log entry."); }
      } catch (error: any) { toast({ title: "Update Failed", description: error.message, variant: "destructive" });} 
      finally { setIsLoading(false); }

    } else {
      // Handle batch add
      const validItems = items.filter(item => item.productId && item.quantityToAdjust !== 0);
      if (validItems.length === 0) {
        toast({ title: "Error", description: "Please add at least one product with a non-zero quantity.", variant: "destructive" });
        setIsLoading(false); return;
      }

      const batchStockLogPayloads = validItems.map((item, index) => ({
          logNumber: `${batchLogNumber}-ITEM-${index + 1}`, productId: item.productId!,
          productName: item.productName, quantityAdjusted: Number(item.quantityToAdjust),
          adjustmentType, // Use the form's selected adjustment type
          adjustmentDate: format(adjustmentDate, "yyyy-MM-dd HH:mm:ss"),
          notes: `Batch: ${batchLogNumber}. ${notes || ''}`.trim(),
          // Previous stock is the current stock *before* this batch operation.
          // This is tricky if multiple items in the batch affect the same product.
          // For simplicity, we use the currentStock value fetched when the product was selected.
          // The backend should handle the actual stock updates sequentially within a transaction.
          previousStock: Number(item.currentStock), 
          newStock: Number(item.currentStock) + Number(item.quantityToAdjust), // Tentative, backend will recalculate
          createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      }));
      const overallPayload = { batchLogNumber: batchLogNumber, items: batchStockLogPayloads };
      console.log("Submitting Add Batch Payload:", JSON.stringify(overallPayload, null, 2));

      try {
        const response = await fetch('https://sajfoods.net/busa-api/database/save_product_stock_log_batch.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(overallPayload),
        });
        if (!response.ok) {
            const errorText = await response.text(); throw new Error(`Server error: ${response.status} - ${errorText.substring(0,100)}`);
        }
        const result = await response.json();
        if (result.success) {
            toast({ title: "Stock Added Successfully", description: `${validItems.length} product(s) stock levels updated. Batch: ${batchLogNumber}`});
            if (onSaveSuccess) onSaveSuccess(); else router.push('/products/stock-management/log');
        } else { throw new Error(result.message || "Failed to save batch stock adjustment log."); }
      } catch (error: any) { toast({ title: "Save Failed", description: error.message, variant: "destructive" }); }
      finally { setIsLoading(false); }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6 items-end">
        <div>
          <Label htmlFor="logIdentifier">{isEditMode ? "Editing Log ID" : "Batch Reference ID"}</Label>
          <Input id="logIdentifier" value={batchLogNumber} onChange={e => setBatchLogNumber(e.target.value)} readOnly={isEditMode} className={isEditMode ? "bg-muted/50" : ""}/>
        </div>
        <div>
          <Label htmlFor="adjustmentDate">Adjustment Date <span className="text-destructive">*</span></Label>
          <DatePickerComponent date={adjustmentDate} setDate={setAdjustmentDate} />
        </div>
      </div>
      <div>
        <Label htmlFor="adjustmentType">Adjustment Type <span className="text-destructive">*</span></Label>
        <Select 
            value={adjustmentType} 
            onValueChange={(value: ProductStockAdjustmentType) => setAdjustmentType(value)}
            disabled={isEditMode && (existingLogEntry?.adjustmentType === 'SALE_DEDUCTION' || existingLogEntry?.adjustmentType === 'RETURN_ADDITION')} // Prevent changing type for sales-related logs
        >
            <SelectTrigger id="adjustmentType">
                <SelectValue placeholder="Select adjustment type" />
            </SelectTrigger>
            <SelectContent>
                {productStockAdjustmentTypes
                  .filter(type => !(isEditMode && (type === 'SALE_DEDUCTION' || type === 'RETURN_ADDITION')) || type === existingLogEntry?.adjustmentType) // Filter out sales types in edit unless it's the original type
                  .map(type => (
                    <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        {isEditMode && (existingLogEntry?.adjustmentType === 'SALE_DEDUCTION' || existingLogEntry?.adjustmentType === 'RETURN_ADDITION') && (
            <p className="text-xs text-muted-foreground mt-1">Adjustment type for sales-related logs cannot be changed.</p>
        )}
      </div>
      
      {!isEditMode ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Product</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="w-[25%]">Quantity to Adjust (+/-)</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Select value={item.productId || ""} onValueChange={(value) => handleItemChange(item.id, 'productId', value)} disabled={isLoadingProducts}>
                      <SelectTrigger><SelectValue placeholder={isLoadingProducts ? "Loading..." : "Select product"} /></SelectTrigger>
                      <SelectContent>
                        {availableProducts.length > 0 ? availableProducts.map(p => (
                          <SelectItem key={p.id} value={p.id} disabled={items.some(i => i.productId === p.id && i.id !== item.id)}>
                            {p.name} ({p.sku || 'No SKU'}) - Stock: {p.stock}
                          </SelectItem>
                        )) : <SelectItem value="no-products" disabled>No products available</SelectItem>}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={item.currentStock} readOnly disabled className="bg-muted/50"/></TableCell>
                  <TableCell><Input value={item.unitOfMeasure} readOnly disabled className="bg-muted/50"/></TableCell>
                  <TableCell>
                    <Input type="number" value={item.quantityToAdjust} onChange={(e) => handleItemChange(item.id, 'quantityToAdjust', e.target.value)} step="any" disabled={!item.productId} 
                           className={`${Number(item.quantityToAdjust) >= 0 ? 'border-green-500' : 'border-destructive'} focus:ring-primary`}/>
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItemRow(item.id)} disabled={items.length === 1 && !item.productId}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow} disabled={isLoadingProducts}><PlusCircle className="mr-2 h-4 w-4" /> Add Another Product</Button>
        </>
      ) : items[0] ? ( // Single item display for edit mode
        <div className="space-y-4 border p-4 rounded-md">
            <div>
                <Label>Product</Label>
                <Input value={items[0].productName} readOnly disabled className="bg-muted/50"/>
                <p className="text-xs text-muted-foreground mt-1">Original Stock at time of log: {existingLogEntry?.previousStock} {items[0].unitOfMeasure}</p>
            </div>
             <div>
                <Label htmlFor="quantityToAdjustEdit">Quantity Adjusted <span className="text-destructive">*</span></Label>
                <Input id="quantityToAdjustEdit" type="number" value={items[0].quantityToAdjust} onChange={(e) => handleItemChange(items[0].id, 'quantityToAdjust', e.target.value)} step="any" 
                       className={`${Number(items[0].quantityToAdjust) >= 0 ? 'border-green-500' : 'border-destructive'} focus:ring-primary`}
                />
                <p className="text-xs text-muted-foreground mt-1">Unit: {items[0].unitOfMeasure}. Enter positive for addition, negative for subtraction.</p>
            </div>
        </div>
      ) : <p className="text-destructive">Error: Log entry data not available for editing.</p>}

      <div>
        <Label htmlFor="notes">Reason / Notes ({isEditMode ? "for this specific entry" : "for Batch"})</Label>
        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Weekly stock replenishment, Correction of previous entry, Spoilage"/>
      </div>
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
        <Button type="submit" 
            disabled={isLoading || isLoadingProducts || (isEditMode && (!items[0]?.productId || items[0]?.quantityToAdjust === 0)) || (!isEditMode && items.every(item => !item.productId || item.quantityToAdjust === 0)) || !adjustmentDate }
        >
          {isLoading ? (isEditMode ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin"/>Updating Entry...</> : <><RefreshCw className="mr-2 h-4 w-4 animate-spin"/>Recording Batch...</>) : (isEditMode ? "Save Changes to Log Entry" : "Record Stock Adjustment(s)")}
        </Button>
      </div>
    </form>
  );
}

