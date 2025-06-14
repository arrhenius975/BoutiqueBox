
// src/app/admin/login/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

// This page might be redundant if all sign-ins go through /auth/signin
// and admin access is gated by /admin/layout.tsx.
// For now, it will check auth status and redirect.
export default function AdminLoginPage() {
  const { authUser, userProfile, isLoadingAuth } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (authUser && userProfile?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (authUser && userProfile?.role !== 'admin') {
        router.push('/'); // Not an admin, redirect to home
      } else {
        router.push('/auth/signin'); // Not logged in, redirect to main sign-in page
      }
    }
  }, [authUser, userProfile, isLoadingAuth, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-white">Checking authentication status...</p>
    </div>
  );
}

    