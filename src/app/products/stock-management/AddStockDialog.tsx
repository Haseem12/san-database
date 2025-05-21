"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddStockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onAddStock: (productId: string, quantityToAdd: number) => void;
}

export default function AddStockDialog({ isOpen, onOpenChange, product, onAddStock }: AddStockDialogProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!product) return;
    if (quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a quantity greater than zero.',
        variant: 'destructive',
      });
      return;
    }
    onAddStock(product.id, quantity);
    setQuantity(0); // Reset quantity
    onOpenChange(false); // Close dialog
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Stock for {product.name}</DialogTitle>
          <DialogDescription>
            Current stock: {product.stock} {product.unitOfMeasure}
            {product.unitOfMeasure === 'Litres' && product.litres ? ` (${product.litres}L)` : ''}.
            Enter the quantity to add.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              className="col-span-3"
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit}>Confirm Add Stock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
