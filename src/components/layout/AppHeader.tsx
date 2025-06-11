
"use client";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut } from 'lucide-react';
import { logoutUser, getCurrentUserName } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AppHeader() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setUserName(getCurrentUserName());
  }, []);


  const handleLogout = () => {
    logoutUser();
    router.push('/'); // Redirect to the new login page (root)
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-6 shadow-sm">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* Placeholder for breadcrumbs or page title if needed */}
      </div>
      <div className="flex items-center gap-2">
        {isMounted && userName && (
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Welcome, {userName}
          </span>
        )}
        <Button variant="ghost" size="icon" className="rounded-full" title="User Profile (Placeholder)">
          <UserCircle className="h-6 w-6" />
          <span className="sr-only">User Profile</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

    