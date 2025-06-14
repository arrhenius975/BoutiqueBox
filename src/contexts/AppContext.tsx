
"use client";

import type { Product, CartItem, WishlistItem, ProductCategory, AppSection, SectionConfig, SearchFilterType, SupabaseUser } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedRecommendations, type PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { supabase } from '@/data/supabase';
import type { User as AuthUser, Session } from '@supabase/supabase-js';

// Import section-specific data
import { groceryProducts, groceryCategories } from '@/data/groceryProducts';
import { cosmeticsProducts, cosmeticsCategories } from '@/data/cosmeticsProducts';
import { fastfoodProducts, fastfoodCategories } from '@/data/fastfoodProducts';

const sectionsConfig: Record<AppSection, SectionConfig> = {
  grocery: {
    name: 'Grocery',
    path: '/grocery',
    themeClass: 'theme-grocery',
    products: groceryProducts,
    categories: groceryCategories,
    hero: {
      title: 'Fresh Groceries, Delivered Fast!',
      subtitle: 'Your one-stop shop for fresh meats, vegetables, fruits, bread, and more.'
    }
  },
  cosmetics: {
    name: 'Cosmetics',
    path: '/cosmetics',
    themeClass: 'theme-cosmetics',
    products: cosmeticsProducts,
    categories: cosmeticsCategories,
    hero: {
      title: 'Discover Your Radiance',
      subtitle: 'Explore premium skincare, makeup, and fragrances.'
    }
  },
  fastfood: {
    name: 'Fast Food',
    path: '/fastfood',
    themeClass: 'theme-fastfood',
    products: fastfoodProducts,
    categories: fastfoodCategories,
    hero: {
      title: 'Craveable Classics, Speedy Delivery',
      subtitle: 'Get your favorite burgers, pizzas, and sides in a flash.'
    }
  },
};


interface AppContextType {
  cart: CartItem[];
  wishlist: WishlistItem[];
  viewedProducts: string[];
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isRecommendationsModalOpen: boolean;
  recommendations: Product[];
  isLoadingRecommendations: boolean;

  currentSection: AppSection | null;
  currentSectionConfig: SectionConfig | null;

  selectedCategory: ProductCategory | 'all';
  setSelectedCategory: (category: ProductCategory | 'all') => void;

  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchFilterType: SearchFilterType;
  setSearchFilterType: (filterType: SearchFilterType) => void;

  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Auth related
  authUser: AuthUser | null;
  userProfile: SupabaseUser | null;
  isLoadingAuth: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;


  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;

  addToViewedProducts: (productId: string) => void;

  toggleCart: () => void;
  toggleWishlist: () => void;

  openRecommendationsModal: () => void;
  closeRecommendationsModal: () => void;
  fetchRecommendations: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<AppSection | null>(null);
  const [currentSectionConfig, setCurrentSectionConfig] = useState<SectionConfig | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [viewedProducts, setViewedProducts] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isRecommendationsModalOpen, setIsRecommendationsModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilterType, setSearchFilterType] = useState<SearchFilterType>('all');
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<SupabaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);


  const { toast } = useToast();

  const setTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyCurrentTheme = () => {
      if (theme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else if (theme === 'light') {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      } else { 
        if (mediaQuery.matches) {
          root.classList.add('dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        }
      }
    };

    applyCurrentTheme(); 

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyCurrentTheme);
      return () => mediaQuery.removeEventListener('change', applyCurrentTheme);
    } else {
      mediaQuery.removeEventListener('change', applyCurrentTheme);
    }
  }, [theme]);


 useEffect(() => {
    if (!pathname) return;

    let newActiveSection: AppSection | null = null;
    if (pathname.startsWith('/grocery')) newActiveSection = 'grocery';
    else if (pathname.startsWith('/cosmetics')) newActiveSection = 'cosmetics';
    else if (pathname.startsWith('/fastfood')) newActiveSection = 'fastfood';
    
    const isSearchRelevantPage = pathname === '/sections' ||
                                 pathname.startsWith('/grocery') ||
                                 pathname.startsWith('/cosmetics') ||
                                 pathname.startsWith('/fastfood');

    if (!isSearchRelevantPage && searchTerm) {
      setSearchTerm('');
      setSearchFilterType('all');
    }

    if (newActiveSection) {
      if (newActiveSection !== currentSection) {
        setCurrentSection(newActiveSection);
        setCurrentSectionConfig(sectionsConfig[newActiveSection]);
        setCart([]);
        setWishlist([]);
        setViewedProducts([]);
        setRecommendations([]);
        setSelectedCategory('all');
      }
    } else {
      if (currentSection !== null) { 
        setCurrentSection(null);
        setCurrentSectionConfig(null);
        setCart([]);
        setWishlist([]);
        setViewedProducts([]);
        setRecommendations([]);
        setSelectedCategory('all');
        if (pathname === '/' && searchTerm) { 
            setSearchTerm('');
            setSearchFilterType('all');
        }
      }
    }
  }, [pathname, currentSection, searchTerm]);

  // Auth state change listener
  useEffect(() => {
    setIsLoadingAuth(true);
    const getInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setAuthUser(session.user);
            const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', session.user.id)
                .single();
            if (error) {
                console.error('Error fetching user profile:', error);
            } else {
                setUserProfile(profile as SupabaseUser);
            }
        }
        setIsLoadingAuth(false);
    };
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoadingAuth(true);
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
        if (error) {
          toast({ title: "Error fetching profile", description: error.message, variant: "destructive" });
          setUserProfile(null);
        } else {
          setUserProfile(profile as SupabaseUser);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [toast]);

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed In Successfully!"});
      // Profile will be fetched by onAuthStateChange
    }
    setIsLoadingAuth(false);
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    setIsLoadingAuth(true);
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: { name: name } // This name is for auth.users.user_metadata, trigger handles users table
        }
    });

    if (error) {
      toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
    } else if (data.user) {
      // The trigger 'handle_new_user' should create a row in public.users.
      // We can then update it with the name if needed, although the trigger might be enough if it also handles name.
      // For now, we assume the trigger handles email, and the user can update their name on their profile page.
      // If your handle_new_user trigger doesn't include name, you'd do an update here.
      // Example if name needs to be updated on public.users after signup and trigger:
      // const { error: updateError } = await supabase
      //   .from('users')
      //   .update({ name: name })
      //   .eq('auth_id', data.user.id);
      // if (updateError) {
      //    toast({ title: "Profile Update Failed", description: updateError.message, variant: "destructive" });
      // }

      toast({ title: "Sign Up Successful!", description: "Please check your email to verify your account." });
    }
    setIsLoadingAuth(false);
  };
  
  const signOut = async () => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
    } else {
      setAuthUser(null);
      setUserProfile(null);
      toast({ title: "Signed Out"});
      router.push('/'); // Redirect to home after sign out
    }
    setIsLoadingAuth(false);
  };


  const addToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    toast({
      title: "Removed from Cart",
      description: `Item has been removed from your cart.`,
      variant: "destructive"
    });
  }, [toast]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ).filter(item => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart.",
    });
  }, [toast]);

  const addToWishlist = useCallback((product: Product) => {
    setWishlist((prevWishlist) => {
      if (prevWishlist.find((item) => item.id === product.id)) {
        toast({
          title: "Already in Wishlist",
          description: `${product.name} is already in your wishlist.`,
        });
        return prevWishlist;
      }
      toast({
        title: "Added to Wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
      return [...prevWishlist, product];
    });
  }, [toast]);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== productId));
    toast({
      title: "Removed from Wishlist",
      description: `Item has been removed from your wishlist.`,
      variant: "destructive"
    });
  }, [toast]);

  const addToViewedProducts = useCallback((productId: string) => {
    setViewedProducts((prev) => {
      if (prev.includes(productId)) return prev;
      const newViewed = [...prev, productId];
      return newViewed.slice(-10);
    });
  }, []);

  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  const toggleWishlist = useCallback(() => setIsWishlistOpen(prev => !prev), []);
  const openRecommendationsModal = useCallback(() => setIsRecommendationsModalOpen(true), []);
  const closeRecommendationsModal = useCallback(() => setIsRecommendationsModalOpen(false), []);

  const fetchRecommendations = useCallback(async () => {
    if (!currentSectionConfig || viewedProducts.length === 0) {
      toast({
        title: "Not enough data",
        description: "View some products in this section to get personalized recommendations.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingRecommendations(true);
    try {
      const result: PersonalizedRecommendationsOutput = await generatePersonalizedRecommendations({
        viewedProducts: viewedProducts,
      });
      const recommendedProducts = result.recommendations
        .map(id => currentSectionConfig.products.find(p => p.id === id))
        .filter((p): p is Product => Boolean(p));

      setRecommendations(recommendedProducts);
      if (recommendedProducts.length > 0) {
        openRecommendationsModal();
      } else {
        toast({
          title: "No specific recommendations",
          description: "We couldn't find specific recommendations for you at this time. Explore more products!",
        });
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      toast({
        title: "Error",
        description: "Could not fetch recommendations.",
        variant: "destructive",
      });
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [viewedProducts, toast, openRecommendationsModal, currentSectionConfig]);

  return (
    <AppContext.Provider
      value={{
        cart,
        wishlist,
        viewedProducts,
        isCartOpen,
        isWishlistOpen,
        isRecommendationsModalOpen,
        recommendations,
        isLoadingRecommendations,
        currentSection,
        currentSectionConfig,
        selectedCategory,
        setSelectedCategory,
        searchTerm,
        setSearchTerm,
        searchFilterType,
        setSearchFilterType,
        theme,
        setTheme,
        authUser,
        userProfile,
        isLoadingAuth,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        addToViewedProducts,
        toggleCart,
        toggleWishlist,
        openRecommendationsModal,
        closeRecommendationsModal,
        fetchRecommendations,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

    