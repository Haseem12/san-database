
import type { Timestamp } from 'firebase/firestore';

export interface PriceTier {
  priceLevel: string; 
  price: number; 
}

export const priceLevelOptions: string[] = [
  'B1-EX-F/DLR',
  'R-RETAILER-Z1/RTL',
  'Z-DISTRIZ2/RTL',
  'B3-Z3/DLR',
  'AZ-Z1/DISTRI',
  'CUST-STD-Z1/GEN', 
  'CUST-PREM-Z2/SPEC', 
  'DEFAULT', 
];


export type ProductCategory =
  | 'Plain Yogurt' | 'Greek Yogurt' | 'Fruit Yogurt'
  | 'Drinking Yogurt' | 'Frozen Yogurt' | 'Organic Yogurt' | 'Non-Dairy Yogurt' | 'Other Finished Good'
  | 'Additives' | 'Banana Flavor' | 'Chocolate Flavor' | 'Cold Room Item' | 'Culture'
  | 'Electrical Material' | 'Emulsions' | 'Fuel' | 'Mango Flavor' | 'Mechanical Material'
  | 'Milk Product' | 'Orange Flavor' | 'Pineapple Flavor' | 'Preservatives' | 'Strawberry Flavor'
  | 'Sugar Product' | 'Support Material' | 'Sweetener' | 'Thickeners';

export const productCategories: ProductCategory[] = [
  'Plain Yogurt', 'Greek Yogurt', 'Fruit Yogurt',
  'Drinking Yogurt', 'Frozen Yogurt', 'Organic Yogurt', 'Non-Dairy Yogurt', 'Other Finished Good',
  'Additives', 'Banana Flavor', 'Chocolate Flavor', 'Cold Room Item', 'Culture',
  'Electrical Material', 'Emulsions', 'Fuel', 'Mango Flavor', 'Mechanical Material',
  'Milk Product', 'Orange Flavor', 'Pineapple Flavor', 'Preservatives', 'Strawberry Flavor',
  'Sugar Product', 'Support Material', 'Sweetener', 'Thickeners'
];

export type RawMaterialCategory =
  | 'Milk Inputs' | 'Sweeteners' | 'Packaging' | 'Cultures' | 'Flavors & Additives'
  | 'Preservatives' | 'Cleaning Supplies' | 'Maintenance Parts' | 'Office Supplies' | 'Other Supplies';

export const rawMaterialCategories: RawMaterialCategory[] = [
  'Milk Inputs', 'Sweeteners', 'Packaging', 'Cultures', 'Flavors & Additives',
  'Preservatives', 'Cleaning Supplies', 'Maintenance Parts', 'Office Supplies', 'Other Supplies'
];

export type UnitOfMeasure = 'PCS' | 'Litres' | 'KG' | 'Grams' | 'Pack' | 'Sachet' | 'Unit' | 'Carton' | 'Bag' | 'Other';
export const unitsOfMeasure: UnitOfMeasure[] = ['PCS', 'Litres', 'KG', 'Grams', 'Pack', 'Sachet', 'Unit', 'Carton', 'Bag', 'Other'];

export interface Product {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  price: number; 
  costPrice?: number; 
  priceTiers?: PriceTier[]; 
  productCategory: ProductCategory;
  alternateUnits?: string; 
  pcsPerUnit?: number; 
  unitOfMeasure: UnitOfMeasure; 
  litres?: number; 
  sku: string;
  stock: number; 
  lowStockThreshold?: number;
  imageUrl?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface RawMaterial {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  category: RawMaterialCategory;
  sku: string;
  unitOfMeasure: UnitOfMeasure; 
  litres?: number; 
  stock: number; 
  costPrice: number; 
  lowStockThreshold?: number;
  imageUrl?: string;
  supplierId?: string; 
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}


export interface Customer { // This interface might be deprecated if LedgerAccount fully covers it
  id: string; // Firestore document ID
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date | Timestamp;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; 
  totalPrice: number; 
  unitOfMeasure?: UnitOfMeasure; 
}

export interface Sale {
  id: string; // Firestore document ID
  invoiceId?: string; 
  saleDate: Date | Timestamp;
  customer: {
    id: string; 
    name: string;
    priceLevel: string; 
  };
  items: SaleItem[];
  subTotal: number; 
  discountAmount?: number; 
  taxAmount?: number; 
  totalAmount: number; 
  paymentMethod: 'Cash' | 'Card' | 'Transfer' | 'Online';
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Invoice {
  id: string; // Firestore document ID
  saleId?: string;
  invoiceNumber: string;
  issueDate: Date | Timestamp;
  dueDate: Date | Timestamp;
  customer: {
    id: string; 
    name: string;
    email?: string;
    address?: string;
    priceLevel?: string; 
  };
  items: SaleItem[];
  subTotal: number; 
  discountAmount?: number; 
  taxAmount?: number; 
  totalAmount: number; 
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  notes?: string;
  companyDetails: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export const defaultCompanyDetails = {
  name: "SAJ Foods Database",
  address: "123 Dairy Lane, Creamville, YK 54321, Nigeria",
  phone: "+234 800 123 4567",
  email: "billing@sajfoods.com.ng",
  logoUrl: "https://picsum.photos/seed/logo_saj/150/50",
};

export type LedgerAccountType = 'Premium Product' | 'Sales Rep' | 'Standard Product' | 'Supplier' | 'Customer' | 'Bank' | 'Expense' | 'Income' | 'Asset' | 'Liability' | 'Equity';

export const ledgerAccountTypes: LedgerAccountType[] = ['Premium Product', 'Sales Rep', 'Standard Product', 'Supplier', 'Customer', 'Bank', 'Expense', 'Income', 'Asset', 'Liability', 'Equity'];


export interface LedgerAccount {
  id: string; // Firestore document ID
  accountCode: string; 
  priceLevel: string; 
  zone: string; 
  creditPeriod: number;
  creditLimit: number; 
  name: string;
  address: string;
  phone: string;
  accountType: LedgerAccountType;
  bankDetails: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type ReceiptPaymentMethod = 'Cash' | 'Card' | 'Transfer' | 'Online' | 'Cheque';
export const receiptPaymentMethods: ReceiptPaymentMethod[] = ['Cash', 'Card', 'Transfer', 'Online', 'Cheque'];

export type BankName = 
  | 'Access Bank' | 'FCMB' | 'Fidelity Bank' | 'First Bank' | 'GT Bank' 
  | 'Jaiz Bank' | 'Jaiz Premium' | 'Money Point' | 'M.P Abuja' | 'M.P Adarji' 
  | 'M.P Bauchi' | 'M.P Isah' | 'M.P Isah 2' | 'M.P Kano' | 'M.P Lawal' 
  | 'M.P Nura' | 'M.P Ondo/Akure' | 'Other';

export const bankNames: BankName[] = [
  'Access Bank', 'FCMB', 'Fidelity Bank', 'First Bank', 'GT Bank',
  'Jaiz Bank', 'Jaiz Premium', 'Money Point', 'M.P Abuja', 'M.P Adarji',
  'M.P Bauchi', 'M.P Isah', 'M.P Isah 2', 'M.P Kano', 'M.P Lawal',
  'M.P Nura', 'M.P Ondo/Akure', 'Other'
];

export interface Receipt {
  id: string; // Firestore document ID
  receiptNumber: string;
  receiptDate: Date | Timestamp;
  ledgerAccountId: string;
  ledgerAccountName: string; 
  amountReceived: number; 
  paymentMethod: ReceiptPaymentMethod;
  bankName?: BankName; 
  referenceNumber?: string; 
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface PurchaseItem {
  productId: string; 
  productName: string; 
  quantity: number;
  unitCost: number; 
  totalCost: number; 
  unitOfMeasure?: UnitOfMeasure; 
}

export type PurchaseOrderStatus = 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
export const purchaseOrderStatuses: PurchaseOrderStatus[] = ['Draft', 'Ordered', 'Partially Received', 'Received', 'Cancelled'];


export interface PurchaseOrder {
  id: string; // Firestore document ID
  poNumber: string;
  orderDate: Date | Timestamp;
  expectedDeliveryDate?: Date | Timestamp;
  supplier: {
    id: string; 
    name: string;
  };
  items: PurchaseItem[];
  subTotal: number; 
  shippingCost?: number;
  otherCharges?: number;
  totalCost: number; 
  status: PurchaseOrderStatus;
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  receivedItems?: PurchaseItem[]; 
}

export type CreditNoteReason = 
  | 'Travel Expense Reimbursement'
  | 'Returned Goods'
  | 'Damages'
  | 'Service Credit/Discount'
  | 'Error Correction'
  | 'Sales Rep Commission'
  | 'Other Expense Reimbursement'
  | 'Write Off'
  | 'Debt to be Credited'
  | 'Other';

export const creditNoteReasons: CreditNoteReason[] = [
  'Travel Expense Reimbursement',
  'Returned Goods',
  'Damages',
  'Service Credit/Discount',
  'Error Correction',
  'Sales Rep Commission',
  'Other Expense Reimbursement',
  'Write Off',
  'Debt to be Credited',
  'Other',
];

export interface CreditNote {
  id: string; // Firestore document ID
  creditNoteNumber: string;
  creditNoteDate: Date | Timestamp;
  ledgerAccountId: string;
  ledgerAccountName: string; 
  amount: number; 
  reason: CreditNoteReason;
  description?: string; 
  relatedInvoiceId?: string; 
  items?: SaleItem[]; 
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type UsageDepartment = 'Production' | 'Cleaning' | 'Packaging' | 'Maintenance' | 'Office' | 'Wastage' | 'Other';
export const usageDepartments: UsageDepartment[] = ['Production', 'Cleaning', 'Packaging', 'Maintenance', 'Office', 'Wastage', 'Other'];

export interface RawMaterialUsageLog {
  id: string; // Firestore document ID
  usageNumber: string; 
  rawMaterialId: string;
  rawMaterialName: string; 
  quantityUsed: number;
  unitOfMeasure: UnitOfMeasure; 
  department: UsageDepartment;
  usageDate: Date | Timestamp;
  notes?: string;
  recordedBy?: string; 
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp; 
}
