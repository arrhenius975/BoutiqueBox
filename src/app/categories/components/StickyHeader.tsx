// src/app/categories/components/StickyHeader.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StickyHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearchSubmit?: () => void; // Optional: if search should trigger an action
}

export function StickyHeader({ searchTerm, setSearchTerm, onSearchSubmit }: StickyHeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) { // Hide after scrolling down 80px
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current || currentScrollY <= 10) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY < 0 ? 0 : currentScrollY;
    };

    window.addEventListener('scroll', controlHeader, { passive: true });
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, []);

  const handleClearSearch = () => {
    setSearchTerm('');
    inputRef.current?.focus();
  };
  
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
        "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-200/50 dark:border-stone-700/50",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-3xl font-bold text-gradient bg-gradient-to-r from-stone-800 via-amber-700 to-rose-700 dark:from-stone-200 dark:via-amber-300 dark:to-rose-300">
              BoutiqueBox
            </span>
          </Link>
          
          <div className="relative w-full max-w-md">
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="h-11 pl-10 pr-10 rounded-full bg-stone-100/70 dark:bg-stone-800/70 border-stone-300 dark:border-stone-600 focus:ring-2 focus:ring-amber-500 placeholder-stone-500 dark:placeholder-stone-400"
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500 dark:text-stone-400" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/account" className="text-sm font-medium text-stone-700 hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400">
              Account
            </Link>
            <Link href="/help" className="text-sm font-medium text-stone-700 hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400">
              Help
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
