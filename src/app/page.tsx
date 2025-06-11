
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginUser, isAuthenticated } from '@/lib/auth'; 
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/layout/Logo';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already authenticated, redirect them away from login page
    if (isAuthenticated()) {
      router.replace('/dashboard'); // Or your main app page
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!userId.trim()) {
      setError('User ID cannot be empty.');
      setIsLoading(false);
      return;
    }

    const loginResult = loginUser(userId);

    if (loginResult.success) {
      toast({
        title: 'Login Successful',
        description: `Welcome, ${loginResult.user?.name}! Role: ${loginResult.user?.role}`,
      });
      router.push('/dashboard'); // Redirect to dashboard after successful login
    } else {
      setError(loginResult.message || 'Invalid User ID.');
      toast({
        title: 'Login Failed',
        description: loginResult.message || 'Invalid User ID.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };
  
  // If still checking auth status or redirecting, show loading to prevent flicker
  if (typeof window !== 'undefined' && isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 px-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your User ID to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="e.g., FIN001"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    