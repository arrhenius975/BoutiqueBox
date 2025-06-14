
"use client";

import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from "@/components/ui/toaster";
import type { ReactNode } from 'react';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      {children}
      <Toaster />
    </AppProvider>
  );
}
