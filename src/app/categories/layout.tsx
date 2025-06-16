// src/app/categories/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Categories - BoutiqueBox',
  description: 'Discover various collections at BoutiqueBox.',
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>; // The page itself includes StickyHeader and Footer
}
