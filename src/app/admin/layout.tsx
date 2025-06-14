
// src/app/admin/layout.tsx
"use client"; // Required for using hooks like useRouter and useAppContext

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
    if (!isLoadingAuth) {
      if (!authUser || userProfile?.role !== 'admin') {
        router.push('/auth/signin'); // Or a specific "access denied" page
      }
    }
  }, [authUser, userProfile, isLoadingAuth, router]);

  if (isLoadingAuth || (!authUser && !userProfile)) {
    return (
      <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }
  
  if (userProfile?.role !== 'admin') {
    // This case should ideally be caught by the useEffect redirect,
    // but as a fallback, prevent rendering admin content.
     return (
       <>
        <ThemeManager themeClass="" />
        <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
          <p>Access Denied. Redirecting...</p>
        </div>
      </>
     );
  }

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

    