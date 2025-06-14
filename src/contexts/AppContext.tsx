
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

  authUser: AuthUser | null;
  userProfile: SupabaseUser | null;
  isLoadingAuth: boolean;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  setUserProfile: React.Dispatch<React.SetStateAction<SupabaseUser | null>>;

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
  const [userProfile, setUserProfileState] = useState<SupabaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const { toast } = useToast();

  const setUserProfile = useCallback((profile: SupabaseUser | null | ((prevState: SupabaseUser | null) => SupabaseUser | null)) => {
    setUserProfileState(profile);
  }, []);

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
        if (pathname === '/' || pathname.startsWith('/account') || pathname.startsWith('/settings') || pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
           if (searchTerm) setSearchTerm('');
           if (searchFilterType !== 'all') setSearchFilterType('all');
        }
      }
    }
  }, [pathname, currentSection, searchTerm, searchFilterType]);

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data: profileData, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', userId)
      .single();
    if (error) {
      console.error('Error fetching user profile:', error);
      toast({ title: "Profile Error", description: "Could not load your profile details.", variant: "destructive" });
      setUserProfile(null); // Explicitly set to null on error
    } else {
      setUserProfile(profileData as SupabaseUser);
    }
    return profileData; // Return fetched profile data or null
  }, [toast, setUserProfile]); // Added setUserProfile to dependencies

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoadingAuth(true);
      const currentAuthUser = session?.user ?? null;
      setAuthUser(currentAuthUser);

      if (currentAuthUser) {
        await fetchUserProfile(currentAuthUser.id);
      } else {
        setUserProfile(null);
      }
      setIsLoadingAuth(false);
    });
    
    const getInitialSession = async () => {
        setIsLoadingAuth(true);
        const { data: { session } } = await supabase.auth.getSession();
        const initialAuthUser = session?.user ?? null;
        setAuthUser(initialAuthUser);

        if (initialAuthUser) {
            await fetchUserProfile(initialAuthUser.id);
        } else {
            setUserProfile(null);
        }
        setIsLoadingAuth(false);
    };
    getInitialSession();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // fetchUserProfile is now stable

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    setIsLoadingAuth(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
      setIsLoadingAuth(false);
      return false;
    }
    if (data.user) {
      // Auth state change will trigger profile fetch.
      // We don't need to set isLoadingAuth(false) here as onAuthStateChange will handle it.
      toast({ title: "Signed In Successfully!"});
      return true;
    }
    setIsLoadingAuth(false); // Fallback
    return false;
  };

  const signUpWithEmail = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoadingAuth(true);
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: { name: name } 
        }
    });
    
    if (error) {
      toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
      setIsLoadingAuth(false);
      return false;
    }
    
    if (data.user) {
      // Supabase trigger 'handle_new_user' should create the profile.
      // onAuthStateChange will fetch it.
      toast({ title: "Sign Up Successful!", description: "Please check your email to verify your account." });
       // Don't setIsLoadingAuth(false) here; onAuthStateChange will.
      return true;
    }
    
    // Fallback if no user data and no error (should not happen with Supabase normally)
    toast({ title: "Sign Up Incomplete", description: "Something went wrong during sign up.", variant: "destructive"});
    setIsLoadingAuth(false);
    return false;
  };
  
  const signOut = async () => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed Out"});
      // State updates (authUser, userProfile) are handled by onAuthStateChange
      router.push('/'); 
    }
    setIsLoadingAuth(false); // Ensure loading is false after operation
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
      description: `${product.name} is now in your cart.`,
    });
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    toast({
      title: "Removed from Cart",
      description: `Item removed from your cart.`,
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
          title: "Removed from Wishlist",
          description: `${product.name} is no longer in your wishlist.`,
        });
        return prevWishlist.filter(item => item.id !== product.id);
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
      description: `Item removed from your wishlist.`,
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
        title: "Need More Info",
        description: "Explore some products in this section first to get personalized recommendations.",
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
          title: "No Specific Recommendations Yet",
          description: "Keep exploring! We'll find something for you soon.",
        });
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      toast({
        title: "Recommendation Error",
        description: "Could not fetch recommendations at this time.",
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
        setUserProfile,
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
