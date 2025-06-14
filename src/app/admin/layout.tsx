
// src/app/admin/layout.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ThemeManager } from '@/components/ThemeManager';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, userProfile, isLoadingAuth } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) { // Only run checks once auth state is resolved
      if (!authUser) {
        // Not logged in, redirect to sign-in
        router.push('/auth/signin?redirect=/admin/dashboard'); // Optional: add redirect query
      } else if (userProfile && userProfile.role !== 'admin') {
        // Logged in, but not an admin, redirect to home or account page
        toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
        router.push('/account'); 
      } else if (!userProfile && authUser) {
        // Auth user exists, but profile (with role) is not yet loaded.
        // This state is usually brief. The loader below handles it.
        // If it persists, it might indicate an issue fetching the profile.
      }
    }
  }, [authUser, userProfile, isLoadingAuth, router]);

  // Show loading state while auth/profile is being determined
  if (isLoadingAuth || (authUser && !userProfile)) {
    return (
      <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading admin area...</p>
        </div>
      </>
    );
  }
  
  // If, after loading, user is not an admin or not logged in, redirect has already been initiated by useEffect.
  // This check prevents rendering admin content prematurely or to unauthorized users.
  if (!authUser || (userProfile && userProfile.role !== 'admin')) {
     return (
       <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Redirecting...</p>
        </div>
      </>
     );
  }

  // User is authenticated and is an admin
  return (
    <>
      <ThemeManager themeClass="" /> {/* Clears section-specific themes */}
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8 ml-0 md:ml-64"> {/* Adjust ml-64 if sidebar width changes */}
          {children}
        </main>
      </div>
    </>
  );
}

    
