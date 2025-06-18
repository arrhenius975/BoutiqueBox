
// src/app/(app-user)/layout.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSidebar } from '@/components/user/UserSidebar';
import { ThemeManager } from '@/components/ThemeManager';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { useIsMobile } from '@/hooks/use-mobile';

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
      }
      // If authUser exists but userProfile is null, we handle it below.
    }
  }, [authUser, userProfile, isLoadingAuth, router, toast]);

  // Primary Loader: Covers initial auth loading and profile loading if authUser is present.
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

  // After loading, if user is not authenticated, show redirecting message.
  // The useEffect above will handle the actual push to /signin.
  if (!authUser) {
    return (
      <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen items-center justify-center bg-background dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </>
    );
  }

  // At this point, authUser exists, and isLoadingAuth is false.
  // If userProfile is still null, it means profile fetch failed or no profile exists.
  if (!userProfile) {
    return (
      <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
          <UserSidebar /> {/* Show sidebar even if profile is missing, user is logged in */}
          <main className="flex-1 p-4 md:p-8 ml-0 md:ml-60 flex flex-col items-center justify-center">
            <div className="text-center p-6 border rounded-lg shadow-md bg-card max-w-md">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">Profile Data Missing</h2>
              <p className="text-muted-foreground mb-4">
                We couldn't load your profile details. This might be a temporary issue, or your profile setup might be incomplete.
              </p>
              <p className="text-sm text-muted-foreground">
                Please try refreshing the page, or contact support if this persists.
                Ensure the `handle_new_user` trigger is correctly set up in your Supabase database to create user profiles.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">Refresh Page</Button>
            </div>
          </main>
        </div>
        {isMobile && <BottomNavBar />}
      </>
    );
  }

  // User is authenticated and profile is loaded
  return (
    <>
      <ThemeManager themeClass="" />
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
        <UserSidebar />
        <main className="flex-1 p-4 md:p-8 ml-0 md:ml-60"> {/* Adjust ml for sidebar width */}
          {children}
        </main>
      </div>
      {isMobile && <BottomNavBar />}
    </>
  );
}
