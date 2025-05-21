
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerComponent } from "@/components/ui/date-picker";
import { useToast } from '@/hooks/use-toast';
import type { RawMaterial, RawMaterialUsageLog, UnitOfMeasure, UsageDepartment } from '@/types';
import { usageDepartments } from '@/types';
import { mockRawMaterials, mockRawMaterialUsageLogs } from '@/lib/mockData';

interface RecordUsageFormProps {
  onSave: (usageLog: RawMaterialUsageLog) => void;
}

export default function RecordUsageForm({ onSave }: RecordUsageFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [usageNumber, setUsageNumber] = useState(
    `USE-${new Date().getFullYear()}-${String(mockRawMaterialUsageLogs.length + 1).padStart(4, '0')}`
  );
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<string | undefined>(undefined);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<RawMaterial | null>(null);
  const [quantityUsed, setQuantityUsed] = useState<number>(0);
  const [department, setDepartment] = useState<UsageDepartment | undefined>(usageDepartments[0]);
  const [usageDate, setUsageDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedRawMaterialId) {
      const material = mockRawMaterials.find(m => m.id === selectedRawMaterialId);
      setSelectedRawMaterial(material || null);
    } else {
      setSelectedRawMaterial(null);
    }
  }, [selectedRawMaterialId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!selectedRawMaterialId || !selectedRawMaterial) {
      toast({ title: "Error", description: "Please select a raw material.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (quantityUsed <= 0) {
      toast({ title: "Error", description: "Quantity used must be greater than zero.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (quantityUsed > selectedRawMaterial.stock) {
      toast({
        title: "Error",
        description: `Quantity used (${quantityUsed}) cannot exceed available stock (${selectedRawMaterial.stock}).`,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    if (!department) {
      toast({ title: "Error", description: "Please select a department.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!usageDate) {
      toast({ title: "Error", description: "Please select a usage date.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const newUsageLog: RawMaterialUsageLog = {
      id: `use_${Date.now()}`,
      usageNumber,
      rawMaterialId: selectedRawMaterial.id,
      rawMaterialName: selectedRawMaterial.name,
      quantityUsed,
      unitOfMeasure: selectedRawMaterial.unitOfMeasure,
      department,
      usageDate,
      notes,
      createdAt: new Date(),
      // recordedBy: 'current_user_id' // TODO: Implement user context
    };

    // Update stock in mockRawMaterials
    const materialIndex = mockRawMaterials.findIndex(m => m.id === selectedRawMaterial.id);
    if (materialIndex !== -1) {
      mockRawMaterials[materialIndex].stock -= quantityUsed;
      mockRawMaterials[materialIndex].updatedAt = new Date();
    }

    onSave(newUsageLog);

    toast({
      title: "Material Usage Recorded",
      description: `${quantityUsed} ${selectedRawMaterial.unitOfMeasure} of ${selectedRawMaterial.name} recorded for ${department}.`,
    });
    router.push('/store/usage');
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Record Material Usage</CardTitle>
          <CardDescription>Log the consumption of raw materials or store items.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rawMaterial">Raw Material/Store Item <span className="text-destructive">*</span></Label>
              <Select onValueChange={setSelectedRawMaterialId} value={selectedRawMaterialId} required>
                <SelectTrigger id="rawMaterial">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {mockRawMaterials.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.sku}) - Stock: {material.stock} {material.unitOfMeasure}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRawMaterial && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Current stock for {selectedRawMaterial.name}: {selectedRawMaterial.stock} {selectedRawMaterial.unitOfMeasure}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="usageNumber">Usage ID</Label>
              <Input id="usageNumber" value={usageNumber} onChange={e => setUsageNumber(e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantityUsed">Quantity Used <span className="text-destructive">*</span></Label>
              <Input
                id="quantityUsed"
                type="number"
                value={quantityUsed}
                onChange={e => setQuantityUsed(parseFloat(e.target.value) || 0)}
                min="0.01"
                step="any"
                required
                disabled={!selectedRawMaterial}
              />
               {selectedRawMaterial && <p className="mt-1 text-xs text-muted-foreground">Unit: {selectedRawMaterial.unitOfMeasure}</p>}
            </div>
             <div>
              <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value: UsageDepartment) => setDepartment(value)} value={department} required>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {usageDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="usageDate">Usage Date <span className="text-destructive">*</span></Label>
            <DatePickerComponent date={usageDate} setDate={setUsageDate} />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason for usage, project ID, etc..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !selectedRawMaterialId || quantityUsed <= 0 || !department || !usageDate}>
          {isLoading ? 'Recording...' : 'Record Usage'}
        </Button>
      </div>
    </form>
  );
}
