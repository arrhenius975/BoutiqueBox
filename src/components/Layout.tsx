
"use client";

import React from 'react';
import { Header } from '@/components/Header';
import { CartSidebar } from '@/components/CartSidebar';
import { WishlistSidebar } from '@/components/WishlistSidebar';
import { PersonalizedRecommendationsModal } from '@/components/PersonalizedRecommendationsModal';
import { BottomNavBar } from '@/components/BottomNavBar'; // Import the new BottomNavBar

interface LayoutProps {
  children: React.ReactNode;
}

export function LayoutComponent({ children }: LayoutProps) { // Renamed to LayoutComponent
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0"> {/* Added padding for bottom nav on mobile */}
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <CartSidebar />
      <WishlistSidebar />
      <PersonalizedRecommendationsModal />
      <BottomNavBar /> {/* Add the new BottomNavBar here */}
      {/* Footer removed as per request */}
    </div>
  );
}
