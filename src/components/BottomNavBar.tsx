
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

  const sectionHomePath = currentSectionConfig?.path || '/sections';

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

  if (pathname === '/' || (pathname === '/sections' && sectionHomePath === '/sections')) {
    return null;
  }

  return (
    <nav
      className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 md:hidden", // Centered, floating, md:hidden
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12" // Adjusted animation
      )}
    >
      <div className="flex items-center justify-around gap-2 bg-background/90 backdrop-blur-lg rounded-full px-4 py-2 shadow-xl border border-border/30">
        {navItems.map((item) => {
          const isHomeActive = pathname === item.href || (item.label === 'Home' && currentSectionConfig && pathname.startsWith(currentSectionConfig.path) && pathname !== currentSectionConfig.path && !pathname.includes('/checkout') && !pathname.includes('/orders'));
          const isActive = item.label !== 'Home' ? pathname === item.href : isHomeActive;
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors min-w-[50px]", // min-width for items
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" /> {/* Slightly smaller icon for compact bar */}
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
