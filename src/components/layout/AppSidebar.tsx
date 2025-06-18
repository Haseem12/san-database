
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutGrid, ShoppingCart, FileText as ReportIconOriginal, Package, BookUser, ReceiptText, ClipboardList, Warehouse, Layers, ListChecks, NotebookPen, ClipboardSignature, Activity, FileText, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import type { UserRole } from '@/lib/users'; 
import { getCurrentUserRole } from '@/lib/auth';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[]; 
}

const allNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['Finance', 'SalesCoordinator', 'Purchases', 'Store', 'Admin'] },
  { href: '/activities', label: 'Overall Activities', icon: Activity, roles: ['Finance', 'SalesCoordinator', 'Purchases', 'Store', 'Admin'] },
  { href: '/sales', label: 'Sales', icon: ShoppingCart, roles: ['SalesCoordinator', 'Admin'] },
  { href: '/invoices', label: 'Invoices', icon: FileText, roles: ['SalesCoordinator', 'Admin'] },
  { href: '/receipts', label: 'Receipts', icon: ReceiptText, roles: ['Finance', 'Admin'] },
  { href: '/receipts/activity-log', label: 'Receipt Log', icon: ListChecks, roles: ['Finance', 'Admin'] },
  { href: '/credit-notes', label: 'Credit Notes', icon: NotebookPen, roles: ['Finance', 'Admin'] },
  { href: '/purchases', label: 'Purchases', icon: ClipboardList, roles: ['Purchases', 'Admin'] },
  { href: '/products', label: 'Products', icon: Package, roles: ['SalesCoordinator', 'Admin', 'Finance'] },
  { href: '/products/stock-management', label: 'Product Stock', icon: Layers, roles: ['SalesCoordinator', 'Store', 'Admin'] },
  { href: '/products/net-sales-report', label: 'Net Sales Report', icon: BarChart3, roles: ['SalesCoordinator', 'Finance', 'Admin'] },
  { href: '/store', label: 'Store Items', icon: Warehouse, roles: ['Store', 'Admin', 'Purchases'] },
  { href: '/store/usage', label: 'Material Usage', icon: ClipboardSignature, roles: ['Store', 'Admin'] },
  { href: '/ledger-accounts', label: 'Ledger Accounts', icon: BookUser, roles: ['SalesCoordinator', 'Admin', 'Finance', 'Purchases'] },
  { href: '/report', label: 'About the App', icon: ReportIconOriginal, roles: ['Finance', 'SalesCoordinator', 'Purchases', 'Store', 'Admin'] },
];


export default function AppSidebar() {
  const pathname = usePathname();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentUserRole(getCurrentUserRole());
  }, []);

  if (!isMounted) {
    // To prevent flash of unfiltered sidebar or ensure correct role is read client-side first
    return (
      <Sidebar collapsible="icon" side="left" className="border-r">
        <SidebarHeader className="p-4">
          <Logo/>
        </SidebarHeader>
        <SidebarContent>
          {/* Optional: Skeleton loader for sidebar items */}
        </SidebarContent>
      </Sidebar>
    );
  }
  
  const navItems = currentUserRole 
    ? allNavItems.filter(item => item.roles.includes(currentUserRole) || currentUserRole === 'Admin') // Admin sees all
    : []; // No items if no role (e.g., not logged in, though AppLayout should redirect)

  return (
    <Sidebar collapsible="icon" side="left" className="border-r">
      <SidebarHeader className="p-4">
        <Logo/>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/dashboard' && item.href !== '/products' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                >
                  <span> 
                    <item.icon />
                    <span>{item.label}</span>
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
