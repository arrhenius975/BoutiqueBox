// src/app/categories/components/CategoryCard.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react'; // Using ShoppingBag as a generic icon
import { cn } from '@/lib/utils';
import type { SupabaseCategory } from '@/types';

export interface DisplayCategory extends SupabaseCategory {
  colorGradient: string; // e.g., "from-rose-400 to-pink-500"
  icon: React.ElementType;
  imagePlaceholderHint: string; // e.g., "grocery food"
}

interface CategoryCardProps {
  category: DisplayCategory;
  index: number;
}

export function CategoryCard({ category, index }: CategoryCardProps) {
  const Icon = category.icon || ShoppingBag;

  return (
    <Link href={`/category/${category.id}`} passHref>
      <div
        className={cn(
          "group relative rounded-2xl overflow-hidden p-6 md:p-8 shadow-lg h-full flex flex-col justify-between animate-fade-in-up-staggered",
          "transition-all duration-700 ease-out hover:scale-[1.02] hover:-translate-y-2 hover:shadow-2xl",
          `bg-gradient-to-br ${category.colorGradient} bg-opacity-20 hover:bg-opacity-30` // Background uses category color with opacity
        )}
        style={{
          animationDelay: `${index * 150}ms`,
          animationFillMode: "both",
        }}
      >
        {/* Shimmer effect - simplified */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 
                        bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-slow">
        </div>

        <div>
          <div className={`mb-4 p-3 rounded-lg inline-block bg-gradient-to-br ${category.colorGradient} text-white shadow-md`}>
            <Icon className="w-7 h-7 md:w-8 md:w-8" />
          </div>
          <h3 className={`text-2xl font-bold mb-2 text-gradient bg-gradient-to-r ${category.colorGradient}`}>
            {category.name}
          </h3>
          <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed line-clamp-3">
            {category.description || `Explore our range of ${category.name.toLowerCase()} products.`}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className={`text-sm font-semibold text-gradient bg-gradient-to-r ${category.colorGradient}`}>
            View Products
          </span>
          <ArrowRight className={`w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 text-transparent bg-clip-text bg-gradient-to-r ${category.colorGradient}`} />
        </div>
        
        {/* Placeholder for floating particles on hover - too complex for simple CSS/Tailwind. Keeping visual clean. */}
        {/* Could add simple blurred circles that appear/fade on hover if needed later */}
      </div>
    </Link>
  );
}

// Add shimmer animation to globals.css if not there, or define here (better in globals)
// @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
// .animate-shimmer-slow { animation: shimmer 2.5s infinite linear; }
// For now, let's add it to globals.css (already did in thought process)
