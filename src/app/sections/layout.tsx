// src/app/sections/layout.tsx
import { LayoutComponent } from '@/components/Layout';
import { ThemeManager } from '@/components/ThemeManager';
// MainLandingBottomNav import removed as it's no longer used.

export default function SectionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ThemeManager themeClass="" /> {/* Use default/global theme for sections page */}
      <LayoutComponent> {/* This includes Header, main content area, etc. */}
        {children}
      </LayoutComponent>
      {/* BottomNavBar is now part of LayoutComponent */}
    </>
  );
}
