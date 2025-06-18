
// src/app/categories/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Loader2, PackageSearch, AlertTriangle, Leaf, Gem, Utensils, Palette, Cpu, BookOpen, HelpCircle } from 'lucide-react';
import type { SupabaseCategory } from '@/types';
import { StickyHeader } from './components/StickyHeader';
import { CategoryCard, type DisplayCategory } from './components/CategoryCard';
import { Footer } from './components/Footer';
import { useAppContext } from '@/contexts/AppContext';

// Define a mapping for icons and colors based on common category names
// This is a fallback if Supabase doesn't provide this info
const categoryVisualsMap: Record<string, { icon: React.ElementType; colorGradient: string; imagePlaceholderHint: string }> = {
  default: { icon: PackageSearch, colorGradient: "from-stone-400 to-gray-500", imagePlaceholderHint: "category item" },
  grocery: { icon: Leaf, colorGradient: "from-emerald-400 to-green-500", imagePlaceholderHint: "grocery food" },
  cosmetics: { icon: Gem, colorGradient: "from-rose-400 to-pink-500", imagePlaceholderHint: "cosmetics beauty" },
  'fast food': { icon: Utensils, colorGradient: "from-amber-400 to-orange-500", imagePlaceholderHint: "fastfood burger" },
  fashion: { icon: Palette, colorGradient: "from-violet-400 to-purple-500", imagePlaceholderHint: "fashion clothes" },
  tech: { icon: Cpu, colorGradient: "from-sky-400 to-blue-500", imagePlaceholderHint: "tech gadget" },
  literature: { icon: BookOpen, colorGradient: "from-yellow-400 to-amber-500", imagePlaceholderHint: "book literature" },
  // Add more common categories and their visuals
};

export default function CategoriesPage() {
  const [allCategories, setAllCategories] = useState<DisplayCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<DisplayCategory[]>([]);
  const [searchTerm, setSearchTermState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentSection, setCurrentSectionConfig } = useAppContext();

  useEffect(() => {
    // Clear any active section theme/config when on this new categories page
    setCurrentSection(null);
    setCurrentSectionConfig(null);
  }, [setCurrentSection, setCurrentSectionConfig]);


  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch categories' }));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }
      const data: SupabaseCategory[] = await response.json();
      
      const displayData = data.map(cat => {
        const visualKey = cat.name.toLowerCase();
        const visuals = categoryVisualsMap[visualKey] || categoryVisualsMap.default;
        return {
          ...cat,
          icon: visuals.icon,
          colorGradient: visuals.colorGradient,
          imagePlaceholderHint: visuals.imagePlaceholderHint || cat.name.toLowerCase().split(' ')[0] || 'item',
        };
      });
      setAllCategories(displayData);
      setFilteredCategories(displayData);
    } catch (err: any) {
      console.error("Fetch categories error:", err);
      setError(err.message || 'An unexpected error occurred.');
      setAllCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = allCategories.filter(
      (category) =>
        category.name.toLowerCase().includes(lowerSearchTerm) ||
        (category.description && category.description.toLowerCase().includes(lowerSearchTerm))
    );
    setFilteredCategories(filtered);
  }, [searchTerm, allCategories]);

  const FloatingOrb = ({ className, size = "w-32 h-32", delay = "0s", style }: { className: string; size?: string; delay?: string; style?: React.CSSProperties }) => (
    <div
      className={`absolute rounded-full opacity-10 blur-2xl animate-float ${size} ${className}`}
      style={{ animationDelay: delay, ...style }}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-stone-50 via-amber-50 to-rose-50 dark:from-stone-950 dark:via-stone-900 dark:to-black relative overflow-x-hidden">
      {/* Floating Orbs Background */}
      <FloatingOrb className="bg-rose-200 dark:bg-rose-800/50 animate-float" size="w-48 h-48 md:w-72 md:h-72" delay="0s" style={{ top: '10%', left: '5%' }} />
      <FloatingOrb className="bg-amber-200 dark:bg-amber-800/50 animate-float-delayed" size="w-32 h-32 md:w-56 md:h-56" delay="2s" style={{ top: '60%', right: '10%' }} />
      <FloatingOrb className="bg-emerald-200 dark:bg-emerald-800/50 animate-float-slow" size="w-40 h-40 md:w-64 md:h-64" delay="4s" style={{ bottom: '5%', left: '20%' }} />
       <div className="absolute inset-0 bg-grid-stone-200/30 dark:bg-grid-stone-800/20 [mask-image:linear-gradient(to_bottom,white_30%,transparent_90%)] pointer-events-none"></div>


      <StickyHeader searchTerm={searchTerm} setSearchTerm={setSearchTermState} />

      <main className="flex-grow pt-28 md:pt-32 pb-16 container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <section className="text-center mb-12 md:mb-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-gradient bg-gradient-to-r from-stone-800 via-amber-700 to-rose-700 dark:from-stone-100 dark:via-amber-300 dark:to-rose-300 animate-fade-in-up">
            Barak Online Store
          </h1>
          <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            Explore our collections.
          </p>
        </section>

        {loading && (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
            <p className="text-stone-600 dark:text-stone-400">Loading categories...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-10 bg-rose-50 dark:bg-rose-900/30 p-6 rounded-lg border border-rose-200 dark:border-rose-700">
            <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-semibold text-rose-700 dark:text-rose-300 mb-2">Oops! Something went wrong.</h3>
            <p className="text-stone-600 dark:text-stone-400 mb-4">{error}</p>
            <button
              onClick={fetchCategories}
              className="px-6 py-2 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredCategories.length === 0 && (
          <div className="text-center py-10">
            <PackageSearch className="w-16 h-16 text-stone-400 dark:text-stone-500 mx-auto mb-4" />
            <p className="text-xl text-stone-600 dark:text-stone-400">
              No categories found matching your search "{searchTerm}".
            </p>
          </div>
        )}

        {!loading && !error && filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredCategories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
