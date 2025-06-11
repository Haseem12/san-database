
"use client"; 
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { isAuthenticated } from '@/lib/auth'; // Import isAuthenticated
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isAuthenticating, setIsAuthenticating] = React.useState(true); // New state for auth check
  
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    setIsMounted(true);
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('sidebar_state='))
      ?.split('=')[1];
    if (cookieValue !== undefined) {
      setIsSidebarOpen(cookieValue === 'true');
    }
    
    // Authentication check
    if (!isAuthenticated() && pathname !== '/') { // Check if not on the new login page (root)
      router.replace('/'); // Redirect to new login page (root)
    } else {
      setIsAuthenticating(false); // Authentication check complete
    }
  }, [pathname, router]);

  const handleSidebarOpenChange = (open: boolean) => {
    setIsSidebarOpen(open);
    if (typeof window !== 'undefined') {
      document.cookie = `sidebar_state=${open}; path=/; max-age=${60 * 60 * 24 * 7}`; 
    }
  };
  
  if (!isMounted || (isAuthenticating && pathname !== '/')) { // Show loading if not mounted or if authenticating and not on login page
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If on the login page (root), don't render the main app layout (sidebar, header)
  if (pathname === '/') {
    return <>{children}</>;
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

    