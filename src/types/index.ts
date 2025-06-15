
// src/types/index.ts

// --- Frontend UI Specific Types ---
// These types are used by UI components and AppContext.
// Data fetched from Supabase would typically be transformed into these types for display.

// Represents sub-categories within a main section (Grocery, Cosmetics, FastFood)
export type ProductCategory =
  | 'all'
  // Grocery
  | 'meats'
  | 'vegetables'
  | 'fruits'
  | 'breads'
  // Cosmetics
  | 'skincare'
  | 'makeup'
  | 'fragrance'
  // Fast Food
  | 'burgers'
  | 'pizza'
  | 'sides'
  | 'drinks'
  // Categories managed by admin will have string names, these are examples.
  // The actual values might come from `SupabaseCategory.name.toLowerCase()`
  | string; // Allows for dynamically added category names

// Frontend Product type, used by UI components and AppContext.
export interface Product {
  id: string; // Matches Supabase product.id (uuid)
  name: string;
  description: string;
  price: number;
  stock: number; // Added stock
  image: string; // Typically the primary image URL from SupabaseProductImage
  category: ProductCategory; // Frontend specific sub-category string (e.g., from category_id.name)
  category_id?: number; // Added to hold the actual category ID for convenience
  'data-ai-hint': string;
}

// Frontend CartItem type, extends Product for UI convenience
export interface CartItem extends Product {
  quantity: number;
}

// Frontend WishlistItem type (alias for Product for UI purposes)
export interface WishlistItem extends Product {}

// Represents the main sections of the app
export type AppSection =
  | 'grocery'
  | 'cosmetics'
  | 'fastfood'
  // Example additional sections for admin category grouping
  | 'tech'
  | 'fashion'
  | 'literature'
  | 'other'; // A general section if needed

export interface SectionCategory {
  value: ProductCategory; // This is the string name like 'meats' or 'all'
  label: string;
  icon: React.ElementType; // Lucide icon component
  id?: number; // Optional: if this maps to a DB category ID
}

export interface SectionConfig {
  name: string;
  path: string;
  themeClass: string;
  products: Product[]; // Uses the frontend Product type
  categories: SectionCategory[]; // These are the hardcoded section categories for main app navigation
  hero: {
    title: string;
    subtitle: string;
  };
}

export type SearchFilterType = 'all' | 'name' | 'description';

// Mock type used in frontend for Order History page display
export interface DisplayOrder {
  id: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'pending' | 'paid' | string; // Expanded for admin
  totalAmount: number;
  items: Array<{
    id: string; // Product ID
    name: string;
    quantity: number;
    price: number; // Price per item at time of order
    image: string;
    'data-ai-hint': string;
  }>;
  user?: { // Optional user info for admin view
    id: string;
    name?: string | null;
    email: string;
  };
}


// --- Supabase Specific Types (Aligned with the provided SQL schema) ---

export interface SupabaseUser {
  id: string; // uuid, primary key
  auth_id: string; // uuid, not null, unique (Linked to Supabase Auth)
  email: string; // text, not null, unique
  name?: string | null; // text
  avatar_url?: string | null; // text, added for profile pictures
  role: 'admin' | 'staff' | 'customer' | string; // text, default 'customer'
  created_at: string; // timestamp
}

export interface SupabaseCategory {
  id: number; // serial, primary key
  name: string; // text, not null, unique
  description?: string | null; // text
  created_at?: string; // timestamp
  updated_at?: string; // timestamp
}

export interface SupabaseBrand {
  id: number; // serial, primary key
  name: string; // text, not null, unique
  description?: string | null; // text
}

export interface SupabaseProduct {
  id: string; // uuid, primary key
  name: string; // text, not null
  description?: string | null; // text
  price: number; // numeric(10, 2), not null
  stock: number; // integer, default 0
  category_id?: number | null; // integer, references categories(id)
  brand_id?: number | null; // integer, references brands(id)
  created_at: string; // timestamp
  updated_at: string; // timestamp
  data_ai_hint?: string | null; // Added to match product data
}

export interface SupabaseProductImage {
  id: number; // serial, primary key
  product_id: string; // uuid, references products(id)
  image_url: string; // text, not null
  is_primary: boolean; // boolean, default false
}

export interface SupabaseCartItem {
  id: number; // serial, primary key
  user_id?: string | null; // uuid, references users(id)
  product_id?: string | null; // uuid, references products(id)
  quantity: number; // integer, not null
  added_at: string; // timestamp
}

export interface SupabaseWishlistItem {
  id: number; // serial, primary key
  user_id?: string | null; // uuid, references users(id)
  product_id?: string | null; // uuid, references products(id)
  added_at: string; // timestamp
}

export interface SupabaseDraftOrder {
  id: string; // uuid, primary key
  user_id?: string | null; // uuid, references users(id)
  status: string; // text, default 'draft'
  created_at: string; // timestamp
}

export interface SupabaseDraftOrderItem {
  id: number; // serial, primary key
  draft_order_id: string; // uuid, references draft_orders(id)
  product_id?: string | null; // uuid, references products(id)
  quantity: number; // integer, not null
}

export interface SupabaseOrder {
  id: string; // uuid, primary key
  user_id?: string | null; // uuid, references users(id)
  total_amount?: number | null; // numeric(10, 2)
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | string; // text, default 'pending'
  created_at: string; // timestamp
  updated_at?: string; // Added for tracking updates
}

export interface SupabaseOrderItem {
  id: number; // serial, primary key
  order_id: string; // uuid, references orders(id)
  product_id?: string | null; // uuid, references products(id)
  quantity: number; // integer, not null
  price: number; // numeric(10, 2), not null (price at time of order)
}

export interface SupabasePayment {
  id: string; // uuid, primary key
  order_id?: string | null; // uuid, references orders(id)
  payment_method?: string | null; // text
  payment_status: string; // text, default 'pending'
  paid_at?: string | null; // timestamp
}

export interface SupabaseRefund {
  id: number; // serial, primary key
  order_id?: string | null; // uuid, references orders(id)
  reason?: string | null; // text
  status: 'pending' | 'approved' | 'rejected' | string; // text, default 'pending'
  requested_at: string; // timestamp
  resolved_at?: string | null; // timestamp
}

export interface SupabaseManualOrder {
  id: string; // uuid, primary key
  created_by?: string | null; // uuid, references users(id)
  user_id?: string | null; // uuid, references users(id)
  total_amount?: number | null; // numeric(10, 2)
  note?: string | null; // text
  created_at: string; // timestamp
}

export interface SupabaseManualOrderItem {
  id: number; // serial, primary key
  manual_order_id?: string | null; // uuid, references manual_orders(id)
  product_id?: string | null; // uuid, references products(id)
  quantity?: number | null; // integer
  price?: number | null; // numeric(10, 2)
}

export interface SupabaseInventoryAlert {
  id: number; // serial, primary key
  product_id?: string | null; // uuid, references products(id)
  threshold: number; // integer, not null, default 5
  alerted: boolean; // boolean, default false
}

export interface SupabaseReview {
  id: number; // serial, primary key
  user_id?: string | null; // uuid, references users(id)
  product_id?: string | null; // uuid, references products(id)
  rating?: number | null; // integer, check (rating between 1 and 5)
  comment?: string | null; // text
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

export interface SupabaseAddress {
  id: number; // serial, primary key
  user_id?: string | null; // uuid, references users(id)
  full_name?: string | null; // text
  street?: string | null; // text
  city?: string | null; // text
  state?: string | null; // text
  zip?: string | null; // text
  country?: string | null; // text
  phone?: string | null; // text
  is_default: boolean; // boolean, default false
}
