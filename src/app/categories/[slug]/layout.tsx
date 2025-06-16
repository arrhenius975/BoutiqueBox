// src/app/categories/[slug]/layout.tsx
import type { Metadata } from 'next';
import StickyHeader from '../components/StickyHeader'; // Assuming StickyHeader is reusable
import Footer from '../components/Footer'; // Assuming Footer is reusable

// This metadata could be dynamic based on the slug in a real app
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const categoryName = params.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return {
    title: `${categoryName} - BoutiqueBox Collections`,
    description: `Explore products in the ${categoryName} category at BoutiqueBox.`,
  };
}

export default function CategorySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StickyHeader />
      <main>{children}</main>
      <Footer />
    </>
  );
}
