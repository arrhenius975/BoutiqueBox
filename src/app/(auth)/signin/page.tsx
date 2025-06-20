
// src/app/(auth)/signin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2, ShieldCheck } from 'lucide-react';
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
    await signInWithEmail(email, password); // signInWithEmail now also sets isLoadingAuth
    setIsSubmitting(false);
    // Redirection is primarily handled by useEffect based on authUser and userProfile updates from AppContext.
  };

  useEffect(() => {
    // This effect runs when authUser, userProfile, or isLoadingAuth changes.
    // It handles redirecting the user AFTER the auth state is confirmed and profile is loaded.
    if (isLoadingAuth) {
      console.log("[SignInPage] useEffect: isLoadingAuth is true. Waiting...");
      return; // Wait until auth state is settled
    }
    console.log("[SignInPage] useEffect: isLoadingAuth is false. AuthUser:", authUser?.id, "UserProfile:", userProfile?.id, "Role:", userProfile?.role);

    if (authUser && userProfile) { // User is authenticated AND profile is loaded
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        console.log(`[SignInPage] useEffect: Redirecting to param: ${redirectParam}`);
        router.push(redirectParam);
      } else if (userProfile.role === 'admin') {
        console.log("[SignInPage] useEffect: Redirecting admin to /admin/dashboard");
        router.push('/admin/dashboard');
      } else {
        console.log("[SignInPage] useEffect: Redirecting user to /profile");
        router.push('/profile');
      }
    } else if (authUser && !userProfile && !isLoadingAuth) {
      // User is authenticated, but profile hasn't loaded yet (or failed).
      // This state should ideally be brief. If it persists, AppContext's profile fetching has an issue.
      // The loader below handles this visually. No redirect from here.
      console.log("[SignInPage] useEffect: AuthUser exists, but UserProfile is not yet available. Waiting for profile.");
    }
    // If !authUser and !isLoadingAuth, user stays on sign-in page.
    
  }, [authUser, userProfile, isLoadingAuth, router, searchParams]);


  // Show loader if AppContext is still verifying auth OR if user is authenticated but profile is still loading.
  if (isLoadingAuth || (authUser && !userProfile && !isLoadingAuth)) {
    console.log("[SignInPage] Render: Displaying loader. isLoadingAuth:", isLoadingAuth, "authUser:", !!authUser, "!userProfile:", !userProfile);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Checking session...</p>
      </div>
    );
  }

  // If user is authenticated AND profile is loaded, but useEffect for redirection hasn't run yet
  // (or is in progress), show a redirecting message.
  if (authUser && userProfile && !isLoadingAuth) {
     console.log("[SignInPage] Render: AuthUser and UserProfile are loaded. Should be redirecting via useEffect.");
     return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // If not loading and not authenticated, show the sign-in form.
  console.log("[SignInPage] Render: Displaying Sign In form.");
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
              disabled={isSubmitting} // Only disable during direct form submission attempt
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
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            Sign In
          </Button>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
          <div className="mt-2 border-t pt-3 w-full flex justify-center">
            <Link href="/signin?redirect=/admin/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              Admin Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

