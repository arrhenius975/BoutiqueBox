
"use client";

import React from 'react';
import { Header } from '@/components/Header';
import { CartSidebar } from '@/components/CartSidebar';
import { WishlistSidebar } from '@/components/WishlistSidebar';
import { PersonalizedRecommendationsModal } from '@/components/PersonalizedRecommendationsModal';
import { BottomNavBar } from '@/components/BottomNavBar'; 
import { useAppContext } from '@/contexts/AppContext'; // Import useAppContext
import { cn } from '@/lib/utils'; // Import cn for conditional class names
import { usePathname } from 'next/navigation'; // Import usePathname

interface LayoutProps {
  children: React.ReactNode;
}

export function LayoutComponent({ children }: LayoutProps) { 
  const { announcementBanner, isLoadingAnnouncement } = useAppContext();
  const pathname = usePathname();

  // Do not render the global Header on the new /categories page, as it has its own StickyHeader
  const showGlobalHeader = pathname !== '/categories';

  return (
    <div className="flex min-h-screen flex-col">
      {/* Announcement Banner */}
      {!isLoadingAnnouncement && announcementBanner && announcementBanner.enabled && announcementBanner.message && (
        <div 
          className={cn(
            "bg-primary text-primary-foreground text-center py-2 px-4 text-sm font-medium sticky top-0 z-50",
            // If the header itself is also sticky, this might need adjustment
            // For now, making this banner sticky allows it to be seen even if header hides on scroll
          )}
          role="alert"
          aria-live="polite"
        >
          {announcementBanner.message}
        </div>
      )}
      {showGlobalHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
      <CartSidebar />
      <WishlistSidebar />
      <PersonalizedRecommendationsModal />
      <BottomNavBar /> 
    </div>
  );
}
