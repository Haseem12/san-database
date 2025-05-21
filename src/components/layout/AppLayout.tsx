
"use client"; 
import * as React from 'react';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Default to true (expanded) for server-side rendering and initial client render
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    // Client-side only: read cookie after component mounts
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('sidebar_state='))
      ?.split('=')[1];
    if (cookieValue !== undefined) {
      setIsSidebarOpen(cookieValue === 'true');
    }
  }, []);

  const handleSidebarOpenChange = (open: boolean) => {
    setIsSidebarOpen(open);
    if (typeof window !== 'undefined') {
      document.cookie = `sidebar_state=${open}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    }
  };
  
  // Prevent rendering UI that depends on client-side state until mounted
  // This helps avoid hydration mismatches if the cookie value differs from the initial default.
  // The SidebarProvider's `open` prop will use the default `true` on SSR,
  // then update once `isMounted` and `isSidebarOpen` (from cookie) are set.
  if (!isMounted) {
    // Optionally, render a loading state or null until mounted
    // For simplicity, we can proceed with default `isSidebarOpen` value for initial render
    // and let `useEffect` update it. The key is that `SidebarProvider` receives a consistent
    // `open` value during the first client render that matches SSR.
  }

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={handleSidebarOpenChange} defaultOpen={true}>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6 bg-background overflow-y-auto">
            {children}
          </main>
          {/* Optional Footer can be added here */}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
