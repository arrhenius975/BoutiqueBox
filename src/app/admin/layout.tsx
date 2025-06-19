
// src/app/admin/layout.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ThemeManager } from '@/components/ThemeManager';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { Button } from '@/components/ui/button'; // Added Button

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, userProfile, isLoadingAuth } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoadingAuth) {
      console.log("[AdminLayout] useEffect: isLoadingAuth is true. Waiting...");
      return; 
    }
    console.log("[AdminLayout] useEffect: isLoadingAuth is false. AuthUser:", authUser?.id, "UserProfile:", userProfile?.id, "Role:", userProfile?.role);

    if (!authUser) {
      console.log("[AdminLayout] useEffect: No authUser. Redirecting to signin.");
      toast({ title: "Authentication Required", description: "Please sign in to access the admin area.", variant: "destructive"});
      router.push('/signin?redirect=/admin/dashboard');
    } else if (userProfile && userProfile.role !== 'admin') {
      console.log(`[AdminLayout] useEffect: User role is '${userProfile.role}'. Access denied. Redirecting.`);
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/not-authorized');
    } else if (authUser && !userProfile) {
      // This case is handled by the render logic below (Profile Data Missing).
      // It implies auth check is done, user is authed, but profile couldn't be loaded.
      console.warn("[AdminLayout] useEffect: Auth user exists, but profile (with role) is not loaded. Render logic will display message.");
    }
  }, [authUser, userProfile, isLoadingAuth, router, toast]);


  // Primary Loader: Covers initial auth loading AND profile loading if authUser is present.
  if (isLoadingAuth || (authUser && !userProfile && !isLoadingAuth)) { 
    console.log("[AdminLayout] Render: Displaying primary loader. isLoadingAuth:", isLoadingAuth, "authUser:", !!authUser, "userProfile:", !!userProfile);
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
  
  // After primary loading, if authUser is still not present, redirection should be happening.
  // This is a fallback display while router.push in useEffect takes effect.
  if (!authUser) {
    console.log("[AdminLayout] Render: No authUser after load. Displaying redirecting message.");
     return (
       <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </>
     );
  }

  // At this point, authUser exists, and isLoadingAuth is false.
  // If userProfile is still null, it means profile fetch failed or no profile exists.
  if (!userProfile) { 
    console.log("[AdminLayout] Render: AuthUser exists, isLoadingAuth is false, but NO userProfile. Displaying 'Profile Data Missing'.");
    return (
      <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 items-center justify-center"> {/* Centering content */}
          <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center max-w-lg mx-auto"> {/* Centered main content */}
            <div className="text-center p-6 border rounded-lg shadow-md bg-card">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">Admin Profile Data Missing</h2>
              <p className="text-muted-foreground mb-4">
                We couldn't load your admin profile details. This could be due to a delay in profile creation after signup, or the 'admin' role might not be assigned to your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Please ensure your user account (ID: {authUser.id}) has the 'admin' role assigned in the 'users' table in Supabase.
                If you just signed up or your role was recently changed, please try refreshing.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-6">Refresh Page</Button>
            </div>
          </main>
        </div>
      </>
    );
  }
  
  // Final check: userProfile exists, but role is not admin (should be caught by useEffect redirect, this is a fallback)
  if (userProfile.role !== 'admin') {
     console.log("[AdminLayout] Render: UserProfile exists, but role is not admin. Displaying redirecting message.");
     return (
       <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </>
     );
  }

  // User is authenticated, profile is loaded, and role is admin
  console.log("[AdminLayout] Render: AuthUser, UserProfile, and Admin role confirmed. Rendering admin content.");
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
