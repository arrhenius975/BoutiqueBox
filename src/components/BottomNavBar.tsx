
"use client";

import Link from 'next/link';
import { Home, LayoutGrid, HelpCircle, User, Settings } from 'lucide-react'; // Changed SettingsIcon to Settings
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { useState, useEffect, useRef } from 'react';

export function BottomNavBar() {
  const pathname = usePathname();
  const { currentSectionConfig } = useAppContext();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const sectionHomePath = currentSectionConfig?.path || '/sections'; // Default to sections page if no specific section

  const navItems = [
    { href: sectionHomePath, label: 'Home', icon: Home },
    { href: '/sections', label: 'Stores', icon: LayoutGrid },
    { href: '/account', label: 'Account', icon: User },
    { href: '/help', label: 'Help', icon: HelpCircle },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const headerHeight = 80; // Approximate height of a header or some offset

      if (currentScrollY <= 10) { // Always show if near the top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > headerHeight * 0.5) { // Scrolling down
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) { // Scrolling up
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  // Hide this BottomNavBar on the main landing page ('/')
  // and also on the section selector page ('/sections') as per original logic for BottomNavBar.
  if (pathname === '/' ) {
    return null;
  }
  // If we are on /sections page, and the sectionHomePath is also /sections (meaning no specific store is active),
  // then we should also hide it to avoid redundant navigation.
  if (pathname === '/sections' && sectionHomePath === '/sections') {
    return null;
  }


  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background shadow-top md:hidden",
        "transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      {navItems.map((item) => {
        // For "Home", if we are on a product detail page of the current section, it should also be active.
        const isHomeActive = pathname === item.href || (item.label === 'Home' && currentSectionConfig && pathname.startsWith(currentSectionConfig.path) && pathname !== currentSectionConfig.path && !pathname.includes('/checkout') && !pathname.includes('/orders'));
        // For other items, direct path match.
        const isActive = item.label !== 'Home' ? pathname === item.href : isHomeActive;

        const Icon = item.icon;
        return (
          <Link
            href={item.href}
            key={item.label}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors w-1/5", // Distribute width
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
