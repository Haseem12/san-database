// src/lib/users.ts

export type UserRole = 'Finance' | 'SalesCoordinator' | 'Purchases' | 'Store' | 'Admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export const mockUsers: User[] = [
  { id: 'FIN001', name: 'Hannatu Finance', role: 'Finance' },
  { id: 'FIN002', name: 'Ruqayyah Accounts', role: 'Finance' },
  { id: 'SALES001', name: 'Zainab SalesCoord', role: 'SalesCoordinator' },
  { id: 'SALES002', name: 'Sufi SalesRep', role: 'SalesCoordinator' }, // Assuming SalesRep also has SalesCoordinator role for menu
  { id: 'PURCH001', name: 'Adam Purchases', role: 'Purchases' },
  { id: 'STORE001', name: 'Storekeep', role: 'Store' },
  { id: 'ADMIN001', name: 'Sageer Admin', role: 'Admin' },
  // Add more mock users as needed
];
