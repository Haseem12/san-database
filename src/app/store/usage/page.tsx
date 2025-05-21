
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerComponent } from '@/components/ui/date-picker';
import { Search, PlusCircle, Download, Filter } from 'lucide-react';
import type { RawMaterialUsageLog, RawMaterial, UsageDepartment } from '@/types';
import { mockRawMaterialUsageLogs, mockRawMaterials } from '@/lib/mockData';
import { usageDepartments } from '@/types';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';

export default function MaterialUsageLogPage() {
  const [usageLogs, setUsageLogs] = useState<RawMaterialUsageLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [materialFilter, setMaterialFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<UsageDepartment | 'All'>('All');

  useEffect(() => {
    // Simulate fetching data
    setUsageLogs([...mockRawMaterialUsageLogs]);
  }, []);

  const filteredUsageLogs = useMemo(() => {
    let logs = [...usageLogs];

    if (searchTerm) {
      logs = logs.filter(log =>
        log.usageNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.rawMaterialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (fromDate && isValid(fromDate)) {
      const startDate = startOfDay(fromDate);
      logs = logs.filter(log => new Date(log.usageDate) >= startDate);
    }

    if (toDate && isValid(toDate)) {
      const endDate = endOfDay(toDate);
      logs = logs.filter(log => new Date(log.usageDate) <= endDate);
    }

    if (materialFilter !== 'All') {
      logs = logs.filter(log => log.rawMaterialId === materialFilter);
    }

    if (departmentFilter !== 'All') {
      logs = logs.filter(log => log.department === departmentFilter);
    }
    
    logs.sort((a,b) => new Date(b.usageDate).getTime() - new Date(a.usageDate).getTime());

    return logs;
  }, [usageLogs, searchTerm, fromDate, toDate, materialFilter, departmentFilter]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex items-center justify-between pb-4 border-b">
        <h1 className="text-2xl font-semibold">Raw Material Usage Log</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Log
          </Button>
          <Link href="/store/usage/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Record Usage
            </Button>
          </Link>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="fromDate" className="text-sm font-medium">From Date</label>
            <DatePickerComponent date={fromDate} setDate={setFromDate} placeholder="Start date" />
          </div>
          <div>
            <label htmlFor="toDate" className="text-sm font-medium">To Date</label>
            <DatePickerComponent date={toDate} setDate={setToDate} placeholder="End date" />
          </div>
          <div>
            <label htmlFor="materialFilter" className="text-sm font-medium">Material</label>
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger id="materialFilter">
                <SelectValue placeholder="All Materials" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Materials</SelectItem>
                {mockRawMaterials.map(material => (
                  <SelectItem key={material.id} value={material.id}>{material.name} ({material.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="departmentFilter" className="text-sm font-medium">Department</label>
            <Select value={departmentFilter} onValueChange={(value: UsageDepartment | 'All') => setDepartmentFilter(value)}>
              <SelectTrigger id="departmentFilter">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {usageDepartments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Usage Records</CardTitle>
          <CardDescription>
            Showing {filteredUsageLogs.length} of {usageLogs.length} total usage records based on active filters.
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by ID, material name, or notes..."
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
                <TableHead>Usage #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Material Used</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsageLogs.length > 0 ? (
                filteredUsageLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.usageNumber}</TableCell>
                    <TableCell>{format(new Date(log.usageDate), 'PP')}</TableCell>
                    <TableCell>{log.rawMaterialName}</TableCell>
                    <TableCell className="text-right">{log.quantityUsed}</TableCell>
                    <TableCell>{log.unitOfMeasure}</TableCell>
                    <TableCell>{log.department}</TableCell>
                    <TableCell className="max-w-xs truncate" title={log.notes}>{log.notes || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No usage records match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            End of list.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
