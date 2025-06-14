
// src/app/admin/layout.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ThemeManager } from '@/components/ThemeManager';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, userProfile, isLoadingAuth } = useAppContext();
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    if (!isLoadingAuth) { 
      if (!authUser) {
        toast({ title: "Authentication Required", description: "Please sign in to access the admin area.", variant: "destructive"});
        router.push('/signin?redirect=/admin/dashboard'); // Corrected path
      } else if (userProfile && userProfile.role !== 'admin') {
        toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
        router.push('/not-authorized'); 
      } else if (authUser && !userProfile) {
        // Still waiting for profile to load role. Loader handles this.
        // If this state persists, it might indicate an issue fetching the profile or missing role column.
        console.warn("AdminLayout: Auth user exists, but profile (with role) is not yet loaded. Ensure 'role' column exists in 'users' table.");
      }
    }
  }, [authUser, userProfile, isLoadingAuth, router, toast]);


  if (isLoadingAuth || (authUser && !userProfile && !isLoadingAuth)) { 
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
      <ThemeManager themeClass="" /> 
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8 ml-0 md:ml-64"> {/* Ensure ml-0 md:ml-64 for sidebar spacing */}
          {children}
        </main>
      </div>
    </>
  );
}
