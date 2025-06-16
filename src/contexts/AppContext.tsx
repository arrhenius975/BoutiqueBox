
"use client";

import type { Product, CartItem, WishlistItem, ProductCategory, AppSection, SectionConfig, SearchFilterType, SupabaseUser, AnnouncementSetting } from '@/types';
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

  announcementBanner: AnnouncementSetting | null;
  isLoadingAnnouncement: boolean;

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

  const [announcementBanner, setAnnouncementBanner] = useState<AnnouncementSetting | null>(null);
  const [isLoadingAnnouncement, setIsLoadingAnnouncement] = useState(true);

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
        if (pathname === '/' || pathname.startsWith('/account') || pathname.startsWith('/settings') || pathname.startsWith('/auth') || pathname.startsWith('/admin') || pathname.startsWith('/not-authorized')) {
           if (searchTerm) setSearchTerm('');
           if (searchFilterType !== 'all') setSearchFilterType('all');
        }
      }
    }
  }, [pathname, currentSection, searchTerm, searchFilterType]);

  const fetchUserProfile = useCallback(async (userId: string): Promise<SupabaseUser | null> => {
    const { data: profileData, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', userId)
      .single();
    if (error) {
      console.error('Error fetching user profile:', error);
      if (error.code !== 'PGRST116') { 
        toast({ 
          title: "Profile Error", 
          description: `Could not load your profile details. ${error.message}`, 
          variant: "destructive" 
        });
      } else {
        console.warn(`User profile not found for auth_id ${userId}. This is normal for a new user if the database trigger (handle_new_user) hasn't created the public.users entry yet, or if the trigger is missing. Ensure the trigger is set up in Supabase.`);
        toast({
            title: "Profile Setup Pending",
            description: "Your profile is being finalized. If this message persists, please try signing in again shortly or contact support.",
            variant: "default",
            duration: 7000,
        });
      }
      setUserProfile(null); 
      return null;
    } else {
      setUserProfile(profileData as SupabaseUser);
      return profileData as SupabaseUser;
    }
  }, [toast, setUserProfile]); 

  useEffect(() => {
    setIsLoadingAuth(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase Auth Event:', event, 'Session User:', session?.user?.email, 'Confirmed:', session?.user?.email_confirmed_at);
      const currentAuthUser = session?.user ?? null;
      setAuthUser(currentAuthUser);

      if (currentAuthUser) {
        if (event === 'SIGNED_IN' && !currentAuthUser.email_confirmed_at) {
          console.log('User signed in but email not yet confirmed.');
        } else if ((event === 'USER_UPDATED' || event === 'SIGNED_IN') && currentAuthUser.email_confirmed_at && !userProfile?.email) {
          console.log('User email confirmed or user updated post-confirmation.');
          // Toast for email verification only if it just happened
          if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at && !session?.user?.user_metadata?.email_verified_toast_shown) {
              toast({ title: "Email Verified!", description: "Your email has been successfully verified. You can now sign in." });
              // Optionally, update user metadata to prevent showing this toast again
              // await supabase.auth.updateUser({ data: { email_verified_toast_shown: true } });
          }
        }
        await fetchUserProfile(currentAuthUser.id);
      } else {
        setUserProfile(null);
      }
      setIsLoadingAuth(false);
    });
    
    const getInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const initialAuthUser = session?.user ?? null;
        setAuthUser(initialAuthUser);
        console.log('Initial Session User:', initialAuthUser?.email, 'Confirmed:', initialAuthUser?.email_confirmed_at);

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
  }, [fetchUserProfile, toast, userProfile?.email]);

  useEffect(() => {
    const fetchAppAnnouncement = async () => {
      setIsLoadingAnnouncement(true);
      try {
        const response = await fetch('/api/announcement');
        if (response.ok) {
          const data = await response.json();
          setAnnouncementBanner(data.announcement_banner || { message: '', enabled: false });
        } else {
          console.warn('Failed to fetch announcement banner, using default.');
          setAnnouncementBanner({ message: '', enabled: false });
        }
      } catch (error) {
        console.error("Error fetching announcement banner:", error);
        setAnnouncementBanner({ message: '', enabled: false });
      } finally {
        setIsLoadingAnnouncement(false);
      }
    };
    fetchAppAnnouncement();
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    setIsLoadingAuth(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
      setIsLoadingAuth(false);
      return false;
    }
    toast({ title: "Signed In Successfully!"});
    setIsLoadingAuth(false); 
    return true; 
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
        console.log(`Supabase auth.signUp successful. Auth User ID: ${data.user.id}, Email: ${data.user.email}. Awaiting email confirmation and trigger (handle_new_user) for public.users profile creation.`);
    } else {
        console.warn("Supabase auth.signUp successful, but no user data returned in the response. This might indicate email confirmation is pending or an issue with Supabase project settings (e.g., auto-confirm off).");
    }
    
    toast({ title: "Sign Up Successful!", description: "Please check your email to verify your account." });
    setIsLoadingAuth(false); 
    return true; 
  };
  
  const signOut = async () => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
      setIsLoadingAuth(false); 
    } else {
      toast({ title: "Signed Out"});
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
        announcementBanner,
        isLoadingAnnouncement,
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

