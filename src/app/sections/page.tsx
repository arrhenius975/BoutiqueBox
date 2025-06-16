
// src/app/sections/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingBasket, Sparkles, DrumstickIcon } from 'lucide-react'; // Example icons
import Image from 'next/image';
import { useAppContext } from '@/contexts/AppContext';
import { useEffect } from 'react';

// Define static sections for display
const staticSections = [
  {
    name: 'Grocery',
    description: 'Fresh produce, pantry staples, and more.',
    href: '/grocery',
    icon: ShoppingBasket,
    imagePlaceholder: 'grocery store',
    dataAiHint: 'grocery food',
  },
  {
    name: 'Cosmetics',
    description: 'Skincare, makeup, and beauty essentials.',
    href: '/cosmetics',
    icon: Sparkles,
    imagePlaceholder: 'cosmetics beauty',
    dataAiHint: 'cosmetics makeup',
  },
  {
    name: 'Fast Food',
    description: 'Quick bites, meals, and delicious treats.',
    href: '/fastfood',
    icon: DrumstickIcon,
    imagePlaceholder: 'fast food',
    dataAiHint: 'fastfood burger',
  },
];

export default function SectionsPage() {
  const { searchTerm, setCurrentSection, setCurrentSectionConfig } = useAppContext();

  useEffect(() => {
    // Clear any active section theme/config when on the main sections overview page
    setCurrentSection(null);
    setCurrentSectionConfig(null);
  }, [setCurrentSection, setCurrentSectionConfig]);

  const displayedSections = !searchTerm
    ? staticSections
    : staticSections.filter(
        (section) =>
          section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          section.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gradient-to-br from-background to-secondary/30">
      <header className="text-center mb-16 px-4">
        <h1 className="font-headline text-5xl font-bold text-primary mb-4">
          Our Stores
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose a store to start shopping.
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 max-w-6xl w-full">
        {displayedSections.length > 0 ? displayedSections.map((section) => (
          <Link href={section.href} key={section.name} className="block group">
              <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105 h-full flex flex-col">
                <CardHeader className="p-0">
                  <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                    <Image
                      src={`https://placehold.co/600x400.png?text=${encodeURIComponent(section.name)}`}
                      alt={section.name}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-110"
                      data-ai-hint={section.dataAiHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                     <div className="absolute top-4 right-4 p-3 rounded-full bg-card/80 shadow-lg">
                       <section.icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-6 flex flex-col justify-between">
                  <div>
                    <CardTitle className="font-headline text-2xl mb-2 text-foreground">{section.name}</CardTitle>
                    <CardDescription className="text-muted-foreground mb-4 line-clamp-3">{section.description}</CardDescription>
                  </div>
                  <Button className="w-full mt-auto bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                    Shop {section.name}
                    <span aria-hidden="true" className="ml-2">→</span>
                  </Button>
                </CardContent>
              </Card>
          </Link>
        )) : (
          <div className="col-span-full text-center text-muted-foreground text-lg py-10">
             <p>No stores found matching your search.</p>
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
