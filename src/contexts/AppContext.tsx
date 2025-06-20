
"use client";

import type { Product, CartItem, WishlistItem, ProductCategory, AppSection, SectionConfig, SearchFilterType, SupabaseUser, AnnouncementSetting, SupabaseCategory } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedRecommendations, type PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { supabase } from '@/data/supabase';
import type { User as AuthUser, Session } from '@supabase/supabase-js';

// Import section-specific data (these might become less primary if dynamic categories take over)
import { groceryProducts, groceryCategories } from '@/data/groceryProducts';
import { cosmeticsProducts, cosmeticsCategories } from '@/data/cosmeticsProducts';
import { fastfoodProducts, fastfoodCategories } from '@/data/fastfoodProducts';

// This config is for the old static sections. It will be less used if dynamic categories become primary.
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
  // Default/fallback for dynamic categories if needed, or remove if not applicable
  tech: { name: 'Tech', path: '/category/tech', themeClass: '', products: [], categories: [], hero: { title: 'Tech Gadgets', subtitle: 'Latest tech.'}},
  fashion: { name: 'Fashion', path: '/category/fashion', themeClass: '', products: [], categories: [], hero: { title: 'Fashion Trends', subtitle: 'Stylish apparel.'}},
  literature: { name: 'Literature', path: '/category/literature', themeClass: '', products: [], categories: [], hero: { title: 'Books & More', subtitle: 'Explore new worlds.'}},
  other: { name: 'Other', path: '/category/other', themeClass: '', products: [], categories: [], hero: { title: 'Various Items', subtitle: 'Browse diverse products.'}},
};


interface AppContextType {
  cart: CartItem[];
  wishlist: WishlistItem[];
  viewedProducts: string[]; // IDs of products viewed in the current context (dynamic category or old section)
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isRecommendationsModalOpen: boolean;
  recommendations: Product[]; // Products recommended based on viewedProducts
  isLoadingRecommendations: boolean;

  // For old static sections (grocery, cosmetics, fastfood)
  currentSection: AppSection | null;
  currentSectionConfig: SectionConfig | null;
  setCurrentSection: React.Dispatch<React.SetStateAction<AppSection | null>>;
  setCurrentSectionConfig: React.Dispatch<React.SetStateAction<SectionConfig | null>>;


  // For sub-category filtering WITHIN a section or dynamic category page
  selectedCategory: ProductCategory | 'all'; // This refers to sub-categories like 'meats', 'skincare'
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
  fetchRecommendations: (productsInView?: Product[]) => Promise<void>; // Allow passing current products
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  
  // State for old static sections
  const [currentSection, setCurrentSectionState] = useState<AppSection | null>(null);
  const [currentSectionConfig, setCurrentSectionConfigState] = useState<SectionConfig | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [viewedProducts, setViewedProducts] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isRecommendationsModalOpen, setIsRecommendationsModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  // This selectedCategory is for sub-categories WITHIN a section/dynamic category page
  const [selectedCategory, setSelectedCategoryState] = useState<ProductCategory | 'all'>('all');
  
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

  const setCurrentSection = useCallback((section: AppSection | null) => {
    setCurrentSectionState(section);
  }, []);
  const setCurrentSectionConfig = useCallback((config: SectionConfig | null) => {
    setCurrentSectionConfigState(config);
  }, []);
  const setSelectedCategory = useCallback((category: ProductCategory | 'all') => {
    setSelectedCategoryState(category);
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
    
    const isSearchRelevantPage = pathname === '/categories' || 
                                 pathname.startsWith('/grocery') ||
                                 pathname.startsWith('/cosmetics') ||
                                 pathname.startsWith('/fastfood') ||
                                 pathname.startsWith('/category/'); // Include new dynamic category pages

    if (!isSearchRelevantPage && searchTerm) {
      setSearchTerm('');
      setSearchFilterType('all');
    }

    if (newActiveSection) { // Handling for old static sections
      if (newActiveSection !== currentSection) {
        setCurrentSection(newActiveSection);
        setCurrentSectionConfig(sectionsConfig[newActiveSection]);
        // Reset cart, wishlist, viewedProducts when changing main static sections
        setCart([]);
        setWishlist([]);
        setViewedProducts([]);
        setRecommendations([]);
        setSelectedCategory('all'); // Reset sub-category filter
      }
    } else if (!pathname.startsWith('/category/')) { 
      // If not in a static section AND not in a dynamic category page, clear section context.
      // This allows /categories, /account, etc., to have a neutral context.
      if (currentSection !== null) { 
        setCurrentSection(null);
        setCurrentSectionConfig(null);
        // Potentially reset cart/wishlist here too if they are section-specific
        // For now, let's assume cart/wishlist are global unless on a static section page
         if (pathname === '/' || pathname.startsWith('/account') || pathname.startsWith('/settings') || pathname.startsWith('/auth') || pathname.startsWith('/admin') || pathname.startsWith('/not-authorized') || pathname === '/categories') {
           if (searchTerm) setSearchTerm('');
           if (searchFilterType !== 'all') setSearchFilterType('all');
           if (selectedCategory !== 'all') setSelectedCategory('all'); // Reset sub-category on global pages
        }
      }
    }
    // If pathname.startsWith('/category/'), the specific page will handle its data.
    // AppContext's currentSection/currentSectionConfig will be null, which is intended.

  }, [pathname, currentSection, searchTerm, searchFilterType, selectedCategory, setCurrentSection, setCurrentSectionConfig, setSelectedCategory]);

  const fetchUserProfile = useCallback(async (userId: string): Promise<SupabaseUser | null> => {
    console.log(`[AppContext] fetchUserProfile: Fetching profile for user ID: ${userId}`);
    let profileToSet: SupabaseUser | null = null;
    try {
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();
      if (error) {
        console.error('[AppContext] fetchUserProfile: Error fetching user profile:', error.message);
        if (error.code !== 'PGRST116') { 
          toast({ 
            title: "Profile Error", 
            description: `Could not load your profile details. ${error.message}`, 
            variant: "destructive" 
          });
        } else {
          console.warn(`[AppContext] fetchUserProfile: User profile not found for auth_id ${userId}. This is normal for a new user if the database trigger (handle_new_user) hasn't created the public.users entry yet, or if the trigger is missing. Ensure the trigger is set up in Supabase.`);
        }
      } else {
        console.log(`[AppContext] fetchUserProfile: Profile fetched successfully for user ID: ${userId}`, profileData);
        profileToSet = profileData as SupabaseUser;
      }
    } catch(e) {
        console.error('[AppContext] fetchUserProfile: Exception during fetch:', e);
    } finally {
        setUserProfile(profileToSet); // Set profile (or null if error/not found)
        return profileToSet; // Return what was set
    }
  }, [toast, setUserProfile]); 

  useEffect(() => {
    setIsLoadingAuth(true);
    console.log('[AppContext] useEffect[auth]: Initializing auth state listener. isLoadingAuth=true');
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AppContext] onAuthStateChange: Event:', event, 'Session User:', session?.user?.email);
      setIsLoadingAuth(true); // Set loading true at the start of handling state change
      const currentAuthUser = session?.user ?? null;
      setAuthUser(currentAuthUser);

      try {
        if (currentAuthUser) {
          await fetchUserProfile(currentAuthUser.id);
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        console.error("[AppContext] onAuthStateChange: Error during fetchUserProfile:", e);
        setUserProfile(null);
      } finally {
        setIsLoadingAuth(false);
        console.log(`[AppContext] onAuthStateChange: Done. isLoadingAuth=false. AuthUser: ${currentAuthUser?.id}, UserProfile: ${userProfile?.id} (Note: userProfile here might be stale due to closure, check context value)`);
      }
    });
    
    const getInitialSession = async () => {
      console.log('[AppContext] getInitialSession: Fetching initial session.');
      setIsLoadingAuth(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const initialAuthUser = session?.user ?? null;
        console.log('[AppContext] getInitialSession: Initial Session User:', initialAuthUser?.email);
        setAuthUser(initialAuthUser);

        if (initialAuthUser) {
            await fetchUserProfile(initialAuthUser.id);
        } else {
            setUserProfile(null);
        }
      } catch (e) {
        console.error("[AppContext] getInitialSession: Error during initial session/profile fetch:", e);
        setUserProfile(null); // Ensure profile is null on error
      } finally {
        setIsLoadingAuth(false);
        console.log(`[AppContext] getInitialSession: Done. isLoadingAuth=false. AuthUser: ${authUser?.id}, UserProfile: ${userProfile?.id} (Note: these values might be stale due to closure, check context value)`);
      }
    };
    getInitialSession();

    return () => {
      authListener?.subscription.unsubscribe();
      console.log('[AppContext] useEffect[auth]: Auth state listener unsubscribed.');
    };
  }, [fetchUserProfile]);


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
    setIsLoadingAuth(true); // Indicate loading start
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
      setIsLoadingAuth(false); // Reset loading on failure
      return false;
    }
    // Success: onAuthStateChange will handle setting authUser, userProfile, and then isLoadingAuth to false.
    toast({ title: "Signed In Successfully!"});
    return true; 
  };

  const signUpWithEmail = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoadingAuth(true); // Indicate loading start
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: { name: name } 
        }
    });
    
    if (error) {
      toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
      setIsLoadingAuth(false); // Reset loading on failure
      return false;
    }
    
    if (data.user) {
        console.log(`[AppContext] signUpWithEmail: Supabase auth.signUp successful. Auth User ID: ${data.user.id}, Email: ${data.user.email}.`);
    } else {
        console.warn("[AppContext] signUpWithEmail: Supabase auth.signUp successful, but no user data returned in the response.");
    }
    
    toast({ title: "Sign Up Successful!", description: "Please check your email to verify your account." });
    // Success: onAuthStateChange will handle setting authUser (if auto-confirmed or after confirmation)
    // and then isLoadingAuth to false.
    return true; 
  };
  
  const signOut = async () => {
    setIsLoadingAuth(true); // Indicate loading start
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
      setIsLoadingAuth(false); // Reset loading on failure
    } else {
      toast({ title: "Signed Out"});
      setCart([]);
      setWishlist([]);
      setViewedProducts([]);
      // UserProfile and authUser will be set to null by onAuthStateChange, 
      // which will also set isLoadingAuth to false.
    }
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
      if (prev.includes(productId)) return prev; // Avoid duplicates, keep most recent if re-viewed
      const newViewed = [productId, ...prev.filter(id => id !== productId)]; // Add to front
      return newViewed.slice(0, 10); // Keep last 10 viewed
    });
  }, []);

  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  const toggleWishlist = useCallback(() => setIsWishlistOpen(prev => !prev), []);
  const openRecommendationsModal = useCallback(() => setIsRecommendationsModalOpen(true), []);
  const closeRecommendationsModal = useCallback(() => setIsRecommendationsModalOpen(false), []);

  // Updated fetchRecommendations to optionally take current products in view
  const fetchRecommendations = useCallback(async (productsInView?: Product[]) => {
    if (viewedProducts.length === 0) {
      toast({
        title: "Need More Info",
        description: "Explore some products first to get personalized recommendations.",
      });
      return;
    }
    setIsLoadingRecommendations(true);
    try {
      const result: PersonalizedRecommendationsOutput = await generatePersonalizedRecommendations({
        viewedProducts: viewedProducts,
      });
      
      // Determine the pool of products to select recommendations from
      // If productsInView (e.g., from a dynamic category page) is provided, use that.
      // Otherwise, fallback to currentSectionConfig?.products (for old static sections).
      // If neither, fallback to an empty array.
      const productPool = productsInView || currentSectionConfig?.products || [];

      const recommendedProducts = result.recommendations
        .map(id => productPool.find(p => p.id === id))
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
        setCurrentSection,
        currentSectionConfig,
        setCurrentSectionConfig,
        selectedCategory, // sub-category filter
        setSelectedCategory, // sub-category filter
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

