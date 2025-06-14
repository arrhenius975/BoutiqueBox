
// src/app/(auth)/signin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, isLoadingAuth, authUser, userProfile } = useAppContext();
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithEmail(email, password);
    // AppContext's onAuthStateChange will handle profile fetching and redirects if necessary
    // However, explicit redirect here after successful sign-in attempt might be needed
    // if onAuthStateChange doesn't update userProfile fast enough for the useEffect below.
  };

  useEffect(() => {
    if (!isLoadingAuth && authUser) {
      // Wait for userProfile to be potentially loaded by onAuthStateChange
      if (userProfile) {
        if (userProfile.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/account');
        }
      } else if (authUser && !userProfile) {
        // AuthUser exists, but profile hasn't loaded yet.
        // This state can occur briefly. We can show a loader or wait.
        // For now, if profile is null but authUser exists, we assume it's loading.
        // A more robust solution might involve a specific `isProfileLoading` state.
      }
    }
  }, [authUser, userProfile, isLoadingAuth, router]);


  if (isLoadingAuth && !authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If already logged in and trying to access sign-in, show loader while redirecting
  if (authUser && !isLoadingAuth) { // Check !isLoadingAuth to ensure auth state is settled
     return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirecting...</p>
      </div>
    );
  }


  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <LogIn className="mx-auto h-10 w-10 text-primary mb-3" />
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>Access your BoutiqueBox account.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSignIn}>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoadingAuth}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoadingAuth}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" disabled={isLoadingAuth}>
            {isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            Sign In
          </Button>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
    
