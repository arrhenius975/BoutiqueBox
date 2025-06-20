
// src/app/admin/layout.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ThemeManager } from '@/components/ThemeManager';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react'; 
import { Button } from '@/components/ui/button'; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, userProfile, isLoadingAuth } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect should only run once the auth loading state is settled.
    if (isLoadingAuth) {
      console.log("[AdminLayout] useEffect: isLoadingAuth is true. Waiting for auth state to settle...");
      return; 
    }
    console.log("[AdminLayout] useEffect: isLoadingAuth is false. AuthUser:", authUser?.id, "UserProfile:", userProfile?.id, "Role:", userProfile?.role);

    // If no authenticated user, redirect to sign-in.
    if (!authUser) {
      console.log("[AdminLayout] useEffect: No authUser after loading. Redirecting to signin.");
      toast({ title: "Authentication Required", description: "Please sign in to access the admin area.", variant: "destructive"});
      router.push('/signin?redirect=/admin/dashboard');
    } 
    // If authenticated user exists, but their profile (with role) is loaded and role is not admin.
    else if (userProfile && userProfile.role !== 'admin') {
      console.log(`[AdminLayout] useEffect: User role is '${userProfile.role}'. Access denied. Redirecting.`);
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/not-authorized');
    }
    // If authUser exists, but userProfile is still null (after isLoadingAuth is false),
    // it means the profile fetch failed or the profile doesn't exist.
    // The render logic below will handle displaying a message for this state. No redirect from here.
    else if (authUser && !userProfile) {
      console.warn("[AdminLayout] useEffect: Auth user exists, isLoadingAuth is false, but profile is not loaded. Render logic will display specific message.");
    }
    // If authUser exists and userProfile exists and role IS admin, no redirect is needed from here.
    // The content will render.

  }, [authUser, userProfile, isLoadingAuth, router, toast]);


  // Primary Loader: Covers initial auth loading AND profile loading if authUser is present but profile isn't yet.
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
  
  // Case 1: Not authenticated (after loading is complete)
  // The useEffect above should be handling the redirect, this is a fallback message.
  if (!authUser) {
    console.log("[AdminLayout] Render: No authUser after load. Displaying 'Redirecting to sign in...' message.");
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

  // Case 2: Authenticated, but profile data is missing (after loading is complete)
  // This means authUser exists, isLoadingAuth is false, but userProfile is null.
  if (!userProfile) { 
    console.log("[AdminLayout] Render: AuthUser exists, isLoadingAuth is false, but NO userProfile. Displaying 'Admin Profile Data Missing'.");
    return (
      <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 items-center justify-center">
          <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center max-w-lg mx-auto">
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
  
  // Case 3: Authenticated, profile loaded, but user is not an admin.
  // The useEffect above should handle the redirect, this is a fallback message.
  if (userProfile.role !== 'admin') {
     console.log("[AdminLayout] Render: UserProfile exists, but role is not admin. Displaying 'Access denied. Redirecting...' message.");
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

  // Case 4: Authenticated, profile loaded, and user IS an admin. Render the children.
  console.log("[AdminLayout] Render: AuthUser, UserProfile, and Admin role confirmed. Rendering admin content.");
  return (
    <>
      <ThemeManager themeClass="" /> 
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8 ml-0 md:ml-64">
          {children}
        </main>
      </div>
    </>
  );
}

