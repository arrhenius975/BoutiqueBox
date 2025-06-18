
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

  // Determine the "Home" link for the bottom nav.
  // If in a specific section (grocery, etc.), Home points to that section's root.
  // Otherwise (e.g., on /categories, /profile), Home points to /categories.
  let homePath = '/categories'; // Default home is the main categories/store page
  if (currentSectionConfig && (pathname.startsWith(currentSectionConfig.path) || pathname === currentSectionConfig.path)) {
    homePath = currentSectionConfig.path;
  }

  const navItems = [
    { href: homePath, label: 'Home', icon: Home },
    { href: '/categories', label: 'Stores', icon: LayoutGrid },
    { href: '/profile', label: 'Account', icon: User }, // Updated to /profile
    { href: '/help', label: 'Help', icon: HelpCircle },
    { href: '/user-settings', label: 'Settings', icon: Settings }, // Updated to /user-settings
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

  if (pathname === '/') { // Hide on main landing page
    return null;
  }

  // Determine if the current path matches the "Home" item's href specifically
  const isHomeActive = (itemHref: string, itemLabel: string) => {
    if (itemLabel === 'Home') {
      // If current path is exactly the calculated homePath
      if (pathname === homePath) return true;
      // Or, if in a section context, and current path starts with that section's home path (e.g. product detail page)
      if (currentSectionConfig && pathname.startsWith(currentSectionConfig.path)) return true;
    }
    // For other items, direct path match or startsWith if not a base path like '/categories'
    return pathname === itemHref || (pathname.startsWith(itemHref) && itemHref !== '/categories' && itemHref !== '/profile' && itemHref !== '/user-settings');
  };

  return (
    <nav
      className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 md:hidden", // md:hidden because UserPanelLayout handles desktop sidebar
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      )}
    >
      <div className="flex items-center justify-around gap-2 bg-background/90 backdrop-blur-lg rounded-full px-4 py-2 shadow-xl border border-border/30">
        {navItems.map((item) => {
          const isActive = isHomeActive(item.href, item.label);
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
