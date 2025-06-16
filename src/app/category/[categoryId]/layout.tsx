
// src/app/category/[categoryId]/layout.tsx
"use client";

import { LayoutComponent } from '@/components/Layout';
import { BottomNavBar } from '@/components/BottomNavBar';
import { ThemeManager } from '@/components/ThemeManager';
import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';

export default function CategoryDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setCurrentSection, setCurrentSectionConfig } = useAppContext();

  useEffect(() => {
    // For dynamic category pages, we don't have a specific "section config" like grocery/cosmetics.
    // Clear any existing section-specific context to use default theming and behaviors.
    setCurrentSection(null);
    setCurrentSectionConfig(null);
  }, [setCurrentSection, setCurrentSectionConfig]);

  return (
    <>
      <ThemeManager themeClass="" /> {/* Use default theme */}
      <LayoutComponent>
        {children}
      </LayoutComponent>
      {/* BottomNavBar is rendered within LayoutComponent if needed, or can be added here if LayoutComponent doesn't include it */}
    </>
  );
}
