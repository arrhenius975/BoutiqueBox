
// src/components/user/UserSidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ShoppingBasket, Settings, LogOut, Heart, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserSidebar() {
  const pathname = usePathname();
  const { signOut, isLoadingAuth, userProfile, toggleWishlist } = useAppContext();

  const navItems = [
    { href: '/profile', label: 'My Profile', icon: User },
    // Conditionally add Order History if not admin
    ...(userProfile?.role !== 'admin' ? [{ href: '/orders', label: 'Order History', icon: ShoppingBasket }] : []),
    { href: '/user-settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    // AppContext's signOut will handle redirection if needed
  };

  const userDisplay = {
    name: userProfile?.name || "Valued Customer",
    email: userProfile?.email,
    avatarUrl: userProfile?.avatar_url || `https://placehold.co/100x100.png?text=${(userProfile?.name || userProfile?.email || 'U').substring(0,1).toUpperCase()}`,
    initials: userProfile?.name ? userProfile.name.substring(0,2).toUpperCase() : (userProfile?.email?.substring(0,2).toUpperCase() || 'U'),
  };


  return (
    <aside className="w-60 bg-card text-card-foreground p-4 flex-col fixed h-full border-r hidden md:flex"> {/* Hidden on mobile */}
      <div className="mb-6 text-center">
        <Avatar className="w-20 h-20 ring-2 ring-primary ring-offset-2 mx-auto mb-3">
            <AvatarImage src={userDisplay.avatarUrl} alt={userDisplay.name} data-ai-hint="profile person" />
            <AvatarFallback>{userDisplay.initials}</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold truncate" title={userDisplay.name}>{userDisplay.name}</h2>
        <p className="text-xs text-muted-foreground truncate" title={userDisplay.email}>{userDisplay.email}</p>
      </div>
      <nav className="flex-grow space-y-1.5">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === item.href || (item.href !== '/profile' && pathname.startsWith(item.href))
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
         <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:bg-muted hover:text-foreground px-3 py-2.5"
          onClick={toggleWishlist}
        >
          <Heart className="h-5 w-5" />
          My Wishlist
        </Button>
        {userProfile?.role === 'admin' && (
            <Link
                href="/admin/dashboard"
                className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                <Shield className="h-5 w-5" />
                Admin Panel
            </Link>
        )}
      </nav>
      <div className="mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive px-3 py-2.5"
          onClick={handleLogout}
          disabled={isLoadingAuth}
        >
          {isLoadingAuth ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          {isLoadingAuth ? 'Logging out...' : 'Log Out'}
        </Button>
      </div>
    </aside>
  );
}
