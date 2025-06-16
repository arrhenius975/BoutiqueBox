// src/app/categories/layout.tsx
import { LayoutComponent } from '@/components/Layout';
import { ThemeManager } from '@/components/ThemeManager';

export default function CategoriesPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This page has a very specific theme, which will be largely controlled
  // by its own page.tsx. ThemeManager here ensures any global theme classes
  // are cleared if this page isn't meant to inherit them.
  return (
    <>
      <ThemeManager themeClass="theme-categories-custom" /> {/* Custom class to isolate, or "" to clear */}
      <LayoutComponent>
        {children}
      </LayoutComponent>
    </>
  );
}
