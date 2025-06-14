
// src/app/(auth)/signin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, isLoadingAuth, authUser, userProfile } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await signInWithEmail(email, password);
    setIsSubmitting(false);
    // Redirection will be handled by useEffect based on authUser and userProfile updates
  };

  useEffect(() => {
    // Only redirect if auth state is fully resolved (not loading, and we have authUser)
    if (!isLoadingAuth && authUser) {
      // If userProfile is loaded, we can make role-based decisions
      if (userProfile) {
        const redirectParam = searchParams.get('redirect');
        if (redirectParam) {
          router.push(redirectParam);
        } else if (userProfile.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/account');
        }
      }
      // If authUser exists but userProfile is not yet loaded, wait for the profile.
      // This state is usually brief. The loader below handles it.
    }
  }, [authUser, userProfile, isLoadingAuth, router, searchParams]);


  // Show main loader if auth state is initially loading and no user is yet detected
  if (isLoadingAuth && !authUser && !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If already logged in (authUser exists and auth not loading)
  // and trying to access sign-in, show loader while redirecting.
  // This also covers the case where authUser is set but userProfile is still loading for redirect decision.
  if (authUser && !isLoadingAuth) {
     return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">{userProfile ? 'Redirecting...' : 'Loading profile & redirecting...'}</p>
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
              disabled={isSubmitting || isLoadingAuth}
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
              disabled={isSubmitting || isLoadingAuth}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || isLoadingAuth}>
            {(isSubmitting || isLoadingAuth) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            Sign In
          </Button>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
