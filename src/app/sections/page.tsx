
// src/app/sections/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Layers, Tag, Loader2, AlertTriangle } from 'lucide-react'; // Using Layers as a generic icon
import Image from 'next/image';
import { useAppContext } from '@/contexts/AppContext';
import { useMemo, useEffect, useState } from 'react';
import type { SupabaseCategory } from '@/types';

export default function SectionsPage() {
  const { searchTerm, setCurrentSection, setCurrentSectionConfig } = useAppContext();
  const [categories, setCategories] = useState<SupabaseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear any active section theme/config when on the main sections overview page
    setCurrentSection(null);
    setCurrentSectionConfig(null);

    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch categories' }));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
        const data: SupabaseCategory[] = await response.json();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError((err as Error).message);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [setCurrentSection, setCurrentSectionConfig]);

  const displayedSections = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, categories]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gradient-to-br from-background to-secondary/30">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gradient-to-br from-background to-secondary/30 px-4">
         <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Categories</h2>
        <p className="text-muted-foreground mb-4 max-w-md text-center">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gradient-to-br from-background to-secondary/30">
      <header className="text-center mb-16 px-4">
        <h1 className="font-headline text-5xl font-bold text-primary mb-4">
          Explore Our Categories
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover a wide range of products tailored to your needs.
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4 max-w-7xl w-full">
        {displayedSections.length > 0 ? displayedSections.map((category) => (
          <Link href={`/category/${category.id}`} key={category.id} className="block group">
              <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105 h-full flex flex-col">
                <CardHeader className="p-0">
                  <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                    {/* Placeholder for category image - can be enhanced later if admins can upload category images */}
                    <Image
                      src={`https://placehold.co/600x400.png?text=${encodeURIComponent(category.name.substring(0,2))}`}
                      alt={category.name}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-110"
                      data-ai-hint="category item"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                     <div className="absolute top-4 right-4 p-3 rounded-full bg-card/80 shadow-lg">
                       <Layers className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-6 flex flex-col justify-between">
                  <div>
                    <CardTitle className="font-headline text-2xl mb-2 text-foreground">{category.name}</CardTitle>
                    <CardDescription className="text-muted-foreground mb-4 line-clamp-3">{category.description || 'Explore products in this category.'}</CardDescription>
                  </div>
                  <Button className="w-full mt-auto bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                    Explore {category.name}
                    <span aria-hidden="true" className="ml-2">→</span>
                  </Button>
                </CardContent>
              </Card>
          </Link>
        )) : (
          <div className="md:col-span-full text-center text-muted-foreground text-lg py-10">
            {categories.length === 0 ? 
                <p>No categories found. Admins can add categories in the Admin Panel.</p> :
                <p>No categories match your search.</p>
            }
          </div>
        )}
      </main>

      <footer className="mt-20 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BoutiqueBox. All rights reserved.</p>
         <div className="mt-4 space-x-4">
            <Link href="/help" className="hover:text-primary">Help Center</Link>
            <Link href="/account" className="hover:text-primary">My Account</Link>
          </div>
      </footer>
    </div>
  );
}
