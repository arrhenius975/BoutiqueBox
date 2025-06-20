
"use client";

import Link from 'next/link';
import { ShoppingCart, Heart, ShoppingBag, Lightbulb, MapPin, Search as SearchIcon, Filter, User, LogIn, Settings as SettingsIcon, HelpCircle, Layers, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import type { SectionCategory, SearchFilterType } from '@/types';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const desktopNavItems = [
  { href: '/categories', label: 'Stores', icon: Layers },
  { href: '/profile', label: 'Account', icon: User }, // Updated to /profile
  { href: '/help', label: 'Help', icon: HelpCircle },
  { href: '/user-settings', label: 'Settings', icon: SettingsIcon }, // Updated to /user-settings
];

export function Header() {
  const {
    cart,
    wishlist,
    toggleCart,
    toggleWishlist,
    fetchRecommendations,
    isLoadingRecommendations,
    selectedCategory,
    setSelectedCategory,
    currentSectionConfig,
    currentSection,
    searchTerm,
    setSearchTerm,
    searchFilterType,
    setSearchFilterType,
    authUser,
    userProfile,
    isLoadingAuth,
  } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const headerRef = useRef<HTMLElement>(null);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistItemCount = wishlist.length;

  const categoriesList: SectionCategory[] = currentSectionConfig?.categories || [];
  const sectionName = currentSectionConfig?.name || 'Barak Online Store'; // Updated default name
  const sectionPath = currentSectionConfig?.path || '/categories';


  const isAppFeaturePage = pathname.startsWith('/grocery') ||
                           pathname.startsWith('/cosmetics') ||
                           pathname.startsWith('/fastfood') ||
                           pathname.startsWith('/category/') || // This includes product details under /category/[id]/[pid]
                           pathname === '/categories';

  const isProductDetailPage =
    pathname.split('/').length > 2 && // e.g., /grocery/product-id or /category/cat-id/prod-id
    (pathname.startsWith('/grocery/') || pathname.startsWith('/cosmetics/') || pathname.startsWith('/fastfood/') || pathname.startsWith('/category/'));


  useEffect(() => {
    if (!isAppFeaturePage && pathname !== '/categories' && searchTerm) {
      setSearchTerm('');
    }
  }, [pathname, setSearchTerm, searchTerm, isAppFeaturePage]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const headerHeight = headerRef.current?.offsetHeight || 100;

      if (currentScrollY <= 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > headerHeight * 0.5) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }
      setLastScrollY(currentScrollY <= 0 ? 0 : currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);


  const numCategories = categoriesList.length;
  const categoryArcRadius = 50;
  const yOffsetForArc = 10;
  const angleSpan = numCategories > 1 ? Math.min(120, numCategories * 30) : 0;
  const startAngle = numCategories > 1 ? -angleSpan / 2 : (numCategories === 1 ? 0 : 0);
  const iconPixelWidth = 40;

  const showCategoryArc = currentSectionConfig && categoriesList.length > 0 && !isProductDetailPage && (pathname.startsWith('/grocery') || pathname.startsWith('/cosmetics') || pathname.startsWith('/fastfood'));

  const showGlobalSearch = isAppFeaturePage && !isProductDetailPage && !showCategoryArc;


  // Determine if user panel is active to adjust header styles or content
  const isUserPanelActive = pathname.startsWith('/profile') || pathname.startsWith('/orders') || pathname.startsWith('/user-settings');

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-opacity-65",
        "rounded-b-[25px]",
        (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories'))
          ? "bg-[hsl(var(--header-bg-hsl)/0.85)] text-[hsl(var(--header-fg-hsl))] supports-[backdrop-filter]:bg-[hsl(var(--header-bg-hsl)/0.65)]"
          : "bg-background/85 text-foreground supports-[backdrop-filter]:bg-background/65",
        "transition-transform duration-300 ease-in-out",
        !isHeaderVisible && "-translate-y-full"
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {isProductDetailPage || isUserPanelActive ? ( // Show back arrow on product detail OR user panel pages
            <Button variant="ghost" size="icon" onClick={() => router.back()} className={cn((currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "text-[hsl(var(--header-fg-hsl))]" : "text-foreground", "mr-1 md:mr-2")}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
          ) : null}
          <Link
            href={isUserPanelActive ? "/profile" : sectionPath} // Link to profile if in panel, else section path
            className={cn(
              "flex items-center gap-2",
              (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "text-[hsl(var(--header-fg-hsl))]" : "text-foreground"
            )}
          >
            <ShoppingBag className="h-7 w-7" />
            <span className="font-headline text-xl md:text-2xl font-bold">
              {isUserPanelActive ? "My Panel" : (pathname.startsWith('/categories') ? 'Barak Online Store' : sectionName)}
            </span>
          </Link>
          {currentSectionConfig && !isProductDetailPage && !isUserPanelActive && !pathname.startsWith('/categories') && (
            <div className="hidden md:flex items-center gap-1 text-sm opacity-80">
              <MapPin className="h-4 w-4" />
              <span>Delivering to: CA, USA</span>
            </div>
          )}
        </div>

        {showGlobalSearch && !isUserPanelActive && ( // Hide search if in user panel
          <div className="flex-1 min-w-0 px-2 md:px-4">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto flex items-center">
              <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder={pathname === '/categories' ? "Search categories..." : "Search products..."}
                className={cn(
                  "w-full rounded-lg bg-transparent py-2 pl-8 h-9 text-sm pr-10",
                   (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories'))
                    ? "border-[hsl(var(--header-fg-hsl)/0.3)] text-[hsl(var(--header-fg-hsl))] placeholder:text-[hsl(var(--header-fg-hsl)/0.7)] focus:bg-[hsl(var(--background))] focus:text-foreground"
                    : "border-input placeholder:text-muted-foreground focus:bg-background/50"
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {currentSectionConfig && !pathname.startsWith('/categories') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7",
                        (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "text-[hsl(var(--header-fg-hsl)/0.8)] hover:bg-[hsl(var(--header-fg-hsl)/0.1)] hover:text-[hsl(var(--header-fg-hsl))]" : "text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground"
                      )}
                      aria-label="Search filter options"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={searchFilterType} onValueChange={(value) => setSearchFilterType(value as SearchFilterType)}>
                      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">Product Name</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="description">Description</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}

        <div className={cn(
          "flex items-center gap-x-1 sm:gap-x-2",
          (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "text-[hsl(var(--header-fg-hsl))]" : "text-foreground"
        )}>
          {!isUserPanelActive && ( // Hide desktop nav items when in user panel
            <nav className="hidden md:flex items-center gap-x-3 lg:gap-x-4">
              {desktopNavItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/categories' && item.href !== '/profile' && item.href !== '/user-settings');
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-opacity hover:opacity-80 px-2 py-1 rounded-md flex items-center gap-1.5",
                      isActive ? ((currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "bg-[hsl(var(--header-fg-hsl)/0.15)] opacity-100" : "bg-primary/15 opacity-100 text-primary") : "opacity-90",
                      (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "hover:bg-[hsl(var(--header-fg-hsl)/0.1)]" : "hover:bg-accent/10"
                    )}
                    title={item.label}
                  >
                    <ItemIcon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              {authUser && userProfile && userProfile.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  className={cn(
                    "text-sm font-medium transition-opacity hover:opacity-80 px-2 py-1 rounded-md flex items-center gap-1.5",
                    pathname.startsWith('/admin') ? "bg-primary/15 opacity-100 text-primary" : "opacity-90",
                    "hover:bg-accent/10"
                  )}
                  title="Admin Panel"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </nav>
          )}
          
          {/* Separator, only if desktop nav items were shown */}
          {!isUserPanelActive && (desktopNavItems.length > 0 || (authUser && userProfile && userProfile.role === 'admin')) && <div className={cn("hidden md:block h-6 w-px mx-2", (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "bg-[hsl(var(--header-fg-hsl)/0.3)]" : "bg-border")}></div>}


          <div className="flex items-center gap-x-0.5 sm:gap-x-1">
            {currentSectionConfig && !pathname.startsWith('/categories') && !isProductDetailPage && !isUserPanelActive && (pathname.startsWith('/grocery') || pathname.startsWith('/cosmetics') || pathname.startsWith('/fastfood')) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchRecommendations( currentSectionConfig ? currentSectionConfig.products : undefined)}
                aria-label="Get Personalized Recommendations"
                disabled={isLoadingRecommendations}
                title="Personalized Recommendations"
                className={cn("hover:bg-opacity-10 focus-visible:ring-current", (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "hover:bg-[hsl(var(--header-fg-hsl)/0.1)] focus-visible:ring-[hsl(var(--header-fg-hsl))]" : "hover:bg-accent/10 focus-visible:ring-foreground")}
              >
                <Lightbulb className="h-5 w-5 md:h-6 md:w-6" />
                {isLoadingRecommendations && <span className="sr-only">Loading...</span>}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleWishlist}
              aria-label="Open Wishlist"
              className={cn("relative hover:bg-opacity-10 focus-visible:ring-current", (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "hover:bg-[hsl(var(--header-fg-hsl)/0.1)] focus-visible:ring-[hsl(var(--header-fg-hsl))]" : "hover:bg-accent/10 focus-visible:ring-foreground")}
              title="Wishlist"
            >
              <Heart className="h-5 w-5 md:h-6 md:w-6" />
              {wishlistItemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs">
                  {wishlistItemCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              aria-label="Open Shopping Cart"
              className={cn("relative hover:bg-opacity-10 focus-visible:ring-current", (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "hover:bg-[hsl(var(--header-fg-hsl)/0.1)] focus-visible:ring-[hsl(var(--header-fg-hsl))]" : "hover:bg-accent/10 focus-visible:ring-foreground")}
              title="Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              {cartItemCount > 0 && (
                <Badge className={cn("absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs", (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]" : "bg-accent text-accent-foreground" )}>
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            {/* Auth User Icon: Always show User icon, links to /profile if logged in, else /signin */}
            {!isLoadingAuth && (
              <Link href={authUser ? "/profile" : "/signin"} passHref>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={authUser ? "My Account" : "Sign In"}
                    className={cn("hover:bg-opacity-10 focus-visible:ring-current", (currentSectionConfig && !isUserPanelActive && !pathname.startsWith('/categories')) ? "hover:bg-[hsl(var(--header-fg-hsl)/0.1)] focus-visible:ring-[hsl(var(--header-fg-hsl))]" : "hover:bg-accent/10 focus-visible:ring-foreground")}
                    title={authUser ? "My Account" : "Sign In / Sign Up"}
                  >
                    { authUser ? <User className="h-5 w-5 md:h-6 md:w-6" /> : <LogIn className="h-5 w-5 md:h-6 md:w-6" /> }
                  </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {showCategoryArc && !isUserPanelActive && (
         <div className="relative h-[70px] sm:h-[80px] flex justify-center items-start mt-1 mb-3 overflow-hidden">
          <div className="relative w-[300px] h-[120px] sm:w-[380px] sm:h-[120px] md:w-[450px] md:h-[120px]">
            {categoriesList.map((category, index) => {
              const angle = numCategories === 1 ? 0 : (startAngle + (index / (Math.max(1, numCategories - 1))) * angleSpan);
              const radian = angle * (Math.PI / 180);

              const x = categoryArcRadius * Math.sin(radian);
              const y = yOffsetForArc + categoryArcRadius * Math.cos(radian);

              const iconSizeClass = "w-8 h-8 sm:w-10 sm:h-10";

              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "absolute p-1 sm:p-1.5 rounded-full transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2",
                    currentSectionConfig ? "focus:ring-[hsl(var(--ring))]" : "focus:ring-ring",
                    selectedCategory === category.value
                      ? (currentSectionConfig ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-primary text-primary-foreground shadow-md scale-110')
                      : (currentSectionConfig ? 'bg-[hsl(var(--header-fg-hsl)/0.1)] text-[hsl(var(--header-fg-hsl)/0.9)] hover:bg-[hsl(var(--header-fg-hsl)/0.2)]' : 'bg-primary/10 text-primary hover:bg-primary/20 shadow-sm'),
                    iconSizeClass,
                    "flex flex-col items-center justify-center"
                  )}
                  style={{
                    left: `calc(50% + ${x}px - ${iconPixelWidth / 2}px)`,
                    top: `${y}px`,
                    transform: `rotate(${angle}deg)`,
                  }}
                  title={category.label}
                >
                  <category.icon
                    className={cn(
                      "h-3 w-3 sm:h-4 sm:h-4",
                      selectedCategory === category.value ? '' : ''
                    )} style={{transform: `rotate(${-angle}deg)`}} />
                   <span className="text-[0.5rem] sm:text-[0.55rem] font-medium truncate mt-0.5" style={{transform: `rotate(${-angle}deg)`}}>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
