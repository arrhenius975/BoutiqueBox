
// src/app/(app-user)/layout.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSidebar } from '@/components/user/UserSidebar';
import { ThemeManager } from '@/components/ThemeManager';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile'; // To conditionally hide BottomNavBar

export default function AppUserPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, userProfile, isLoadingAuth } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!authUser) {
        toast({ title: "Authentication Required", description: "Please sign in to access your panel.", variant: "destructive" });
        router.push('/signin?redirect=/profile'); // Redirect to profile after sign-in
      } else if (authUser && !userProfile) {
        // Still waiting for profile to load. Loader handles this.
        console.warn("UserPanelLayout: Auth user exists, but profile is not yet loaded.");
      }
    }
  }, [authUser, userProfile, isLoadingAuth, router, toast]);

  if (isLoadingAuth || (authUser && !userProfile && !isLoadingAuth)) {
    return (
      <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-900">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading your space...</p>
        </div>
      </>
    );
  }

  if (!authUser || !userProfile) { // If still no profile after loading, redirect
    return (
      <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Redirecting...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ThemeManager themeClass="" />
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
        <UserSidebar />
        <main className="flex-1 p-4 md:p-8 ml-0 md:ml-60"> {/* Adjust ml for sidebar width */}
          {children}
        </main>
      </div>
      {isMobile && <BottomNavBar />} {/* Show BottomNavBar only on mobile */}
    </>
  );
}
