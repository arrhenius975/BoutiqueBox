
// src/components/admin/AdminSidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, BarChart2, Users, Settings, LogOut, Shield, ListChecks, PackageCheck, Loader2 } from 'lucide-react'; // Added Loader2
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext'; // Import useAppContext

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/products', label: 'Products', icon: ShoppingBag },
  { href: '/admin/categories', label: 'Categories', icon: ListChecks },
  { href: '/admin/orders', label: 'Orders', icon: PackageCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: Settings }, // Placeholder
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut, isLoadingAuth } = useAppContext(); // Get signOut and isLoadingAuth

  const handleLogout = async () => {
    await signOut();
    // AppContext's signOut will handle redirection
  };

  return (
    <aside className="w-64 bg-slate-800 text-slate-100 p-4 flex flex-col fixed h-full">
      <div className="mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </Link>
      </div>
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-700 hover:text-white"
          onClick={handleLogout}
          disabled={isLoadingAuth} // Disable button if auth is loading
        >
          {isLoadingAuth ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          {isLoadingAuth ? 'Logging out...' : 'Log Out'}
        </Button>
         <p className="text-xs text-slate-500 text-center mt-4">&copy; BoutiqueBox Admin</p>
      </div>
    </aside>
  );
}
