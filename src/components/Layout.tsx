
"use client";

import React from 'react';
import { Header } from '@/components/Header';
import { CartSidebar } from '@/components/CartSidebar';
import { WishlistSidebar } from '@/components/WishlistSidebar';
import { PersonalizedRecommendationsModal } from '@/components/PersonalizedRecommendationsModal';
import { BottomNavBar } from '@/components/BottomNavBar'; 

interface LayoutProps {
  children: React.ReactNode;
}

export function LayoutComponent({ children }: LayoutProps) { 
  return (
    <div className="flex min-h-screen flex-col"> {/* Removed pb-16 md:pb-0 */}
      <Header />
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
