
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
import { LayoutGrid, ShoppingCart, FileText, Package, Milk, BookUser, ReceiptText, ClipboardList, Warehouse, Layers, ListChecks, NotebookPen, ClipboardSignature, Activity } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import Logo from './Logo';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/activities', label: 'Overall Activities', icon: Activity },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/receipts', label: 'Receipts', icon: ReceiptText },
  { href: '/receipts/activity-log', label: 'Receipt Log', icon: ListChecks },
  { href: '/credit-notes', label: 'Credit Notes', icon: NotebookPen },
  { href: '/purchases', label: 'Purchases', icon: ClipboardList },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/products/stock-management', label: 'Product Stock', icon: Layers },
  { href: '/store', label: 'Store Items', icon: Warehouse },
  { href: '/store/usage', label: 'Material Usage', icon: ClipboardSignature },
  { href: '/ledger-accounts', label: 'Ledger Accounts', icon: BookUser },
];

export default function AppSidebar() {
  const pathname = usePathname();

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
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                >
                  <span> {/* Content wrapped in a span to be a single child for Slot */}
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

