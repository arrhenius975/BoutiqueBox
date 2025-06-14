
// src/app/admin/login/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

// This page primarily acts as a gate or redirector for users trying to access /admin/login directly.
// The actual login form is on the main /signin page.
export default function AdminLoginPage() {
  const { authUser, userProfile, isLoadingAuth } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (authUser && userProfile?.role === 'admin') {
        router.push('/admin/dashboard'); // Already admin, go to dashboard
      } else if (authUser && userProfile?.role !== 'admin') {
        router.push('/not-authorized'); // Logged in but not admin
      } else {
        // Not logged in, redirect to main sign-in page with intention to go to admin dashboard after login
        router.push('/signin?redirect=/admin/dashboard'); 
      }
    }
  }, [authUser, userProfile, isLoadingAuth, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-white">Redirecting to login...</p>
    </div>
  );
}
