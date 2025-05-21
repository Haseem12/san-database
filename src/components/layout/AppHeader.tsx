
"use client";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-6 shadow-sm">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* Placeholder for breadcrumbs or page title if needed */}
      </div>
      <Button variant="ghost" size="icon" className="rounded-full">
        <UserCircle className="h-6 w-6" />
        <span className="sr-only">User Profile</span>
      </Button>
    </header>
  );
}
