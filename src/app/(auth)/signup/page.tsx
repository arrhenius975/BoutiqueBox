
// src/app/(auth)/signup/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUpWithEmail, isLoadingAuth, authUser, userProfile } = useAppContext(); // Added userProfile
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUpWithEmail(name, email, password);
    // After sign-up, Supabase typically requires email verification.
    // The user will be in an "unverified" state until they click the link in their email.
    // Redirecting to sign-in or a "please verify" page is common.
    // For now, AppContext's onAuthStateChange will handle future redirects once verified and profile loaded.
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (!isLoadingAuth && authUser) {
      // Wait for userProfile to be potentially loaded by onAuthStateChange
      if (userProfile) {
        if (userProfile.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/account'); // Default redirect for non-admin logged-in users
        }
      } // else: authUser exists, profile not yet loaded, wait for next effect run.
    }
  }, [authUser, userProfile, isLoadingAuth, router]);

  if (isLoadingAuth && !authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If already logged in and trying to access sign-up, show loader while redirecting
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
        <UserPlus className="mx-auto h-10 w-10 text-primary mb-3" />
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>Join BoutiqueBox today!</CardDescription>
      </CardHeader>
      <form onSubmit={handleSignUp}>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoadingAuth}
            />
          </div>
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
              placeholder="•••••••• (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoadingAuth}
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" disabled={isLoadingAuth}>
            {isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
            Sign Up
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
    
