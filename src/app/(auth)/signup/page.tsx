
// src/app/(auth)/signup/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUpWithEmail, isLoadingAuth, authUser, userProfile } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        toast({ title: "Password Too Short", description: "Password must be at least 6 characters.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    const success = await signUpWithEmail(name, email, password);
    setIsSubmitting(false);
    if (success) {
      router.push('/signin');
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && authUser) {
      if (userProfile) {
        if (userProfile.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/profile'); // Updated redirect to /profile
        }
      }
    }
  }, [authUser, userProfile, isLoadingAuth, router]);

  if (isLoadingAuth && !authUser && !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
              disabled={isSubmitting || isLoadingAuth}
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
              disabled={isSubmitting || isLoadingAuth}
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
              disabled={isSubmitting || isLoadingAuth}
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || isLoadingAuth}>
            {(isSubmitting || isLoadingAuth) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
            Sign Up
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/signin" className="font-medium text-primary hover:underline">
              Sign In
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
