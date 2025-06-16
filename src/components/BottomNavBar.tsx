
"use client";

import Link from 'next/link';
import { Home, LayoutGrid, HelpCircle, User, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { useState, useEffect, useRef } from 'react';

export function BottomNavBar() {
  const pathname = usePathname();
  const { currentSectionConfig } = useAppContext();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const sectionHomePath = currentSectionConfig?.path || '/sections'; // Default to /sections if no specific section

  const navItems = [
    { href: sectionHomePath, label: 'Home', icon: Home },
    { href: '/sections', label: 'Stores', icon: LayoutGrid }, // "Stores" now points to /sections
    { href: '/account', label: 'Account', icon: User },
    { href: '/help', label: 'Help', icon: HelpCircle },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const headerHeight = 80; 

      if (currentScrollY <= 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > headerHeight * 0.5) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Hide BottomNavBar on the main landing page
  if (pathname === '/') {
    return null;
  }

  // Logic to determine if Home icon should be active
  const isHomePageActive = (itemHref: string, itemLabel: string) => {
    if (itemLabel === 'Home') {
      // If current path matches the specific section's home path (e.g., /grocery)
      if (currentSectionConfig && pathname === currentSectionConfig.path) return true;
      // If no specific section, and current path is /sections (which is now the main store hub)
      if (!currentSectionConfig && pathname === '/sections') return true;
      // If on a sub-page of a current section (e.g. /grocery/product-id)
      if (currentSectionConfig && pathname.startsWith(currentSectionConfig.path + '/')) return true;
    }
    return pathname === itemHref;
  };


  return (
    <nav
      className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 md:hidden",
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      )}
    >
      <div className="flex items-center justify-around gap-2 bg-background/90 backdrop-blur-lg rounded-full px-4 py-2 shadow-xl border border-border/30">
        {navItems.map((item) => {
          const isActive = isHomePageActive(item.href, item.label);
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors min-w-[50px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
