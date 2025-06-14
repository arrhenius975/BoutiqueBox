
// Represents sub-categories within a main section (Grocery, Cosmetics, FastFood)
// 'all' is a general filter, specific sub-categories follow.
// This is a frontend-specific type for UI filtering based on current mock data structure.
// The backend Supabase schema uses an integer category_id.
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
  | 'drinks';

// Frontend Product type, used by UI components and AppContext.
// Assumes data might be transformed from SupabaseProduct for display.
export interface Product {
  id: string; // Matches Supabase product.id (uuid)
  name: string;
  description: string;
  price: number;
  image: string; // Typically the primary image URL
  category: ProductCategory; // Frontend specific sub-category string
  'data-ai-hint': string;
}

// Frontend CartItem type, extends Product for UI convenience
export interface CartItem extends Product {
  quantity: number;
}

// Frontend WishlistItem type (alias for Product for UI purposes)
export interface WishlistItem extends Product {}

// Represents the main sections of the app
export type AppSection = 'grocery' | 'cosmetics' | 'fastfood';

export interface SectionCategory {
  value: ProductCategory; // Matches the frontend string-based category filter
  label: string;
  icon: React.ElementType; // Lucide icon component
}

export interface SectionConfig {
  name: string;
  path: string;
  themeClass: string;
  products: Product[]; // Uses the frontend Product type
  categories: SectionCategory[]; // Uses frontend SectionCategory type
  hero: {
    title: string;
    subtitle: string;
  };
}

export type SearchFilterType = 'all' | 'name' | 'description';


// --- Supabase Specific Types based on the LATEST SQL Schema ---

export interface SupabaseUser {
  id: string; // uuid, primary key
  email: string; // text, unique not null
  // password field is not typically included in client-side types for security
  name?: string; // text
  role: 'admin' | 'customer' | string; // text, default 'customer'
  created_at: string; // timestamp
}

export interface SupabaseCategory {
  id: number; // serial, primary key
  name: string; // text, not null, unique
  description?: string; // text
}

export interface SupabaseBrand {
  id: number; // serial, primary key
  name: string; // text, not null, unique
  description?: string; // text
}

export interface SupabaseProduct {
  id: string; // uuid, primary key
  name: string; // text, not null
  description?: string; // text
  price: number; // numeric(10, 2), not null
  stock: number; // integer, default 0
  category_id?: number | null; // integer, references categories(id)
  brand_id?: number | null; // integer, references brands(id)
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

export interface SupabaseProductImage {
  id: number; // serial, primary key
  product_id: string; // uuid, references products(id)
  image_url: string; // text, not null
  is_primary: boolean; // boolean, default false
}

export interface SupabaseOrder {
  id: string; // uuid, primary key
  user_id?: string; // uuid, references users(id)
  total_amount?: number; // numeric(10, 2)
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | string; // text, default 'pending'
  created_at: string; // timestamp
}

export interface SupabaseOrderItem {
  id: number; // serial, primary key
  order_id: string; // uuid, references orders(id)
  product_id?: string; // uuid, references products(id)
  quantity: number; // integer, not null
  price: number; // numeric(10, 2), not null (price at time of order)
}

export interface SupabasePayment {
  id: string; // uuid, primary key
  order_id?: string; // uuid, references orders(id)
  payment_method?: string; // text
  payment_status: string; // text, default 'pending'
  paid_at?: string; // timestamp
}

export interface SupabaseAddress {
  id: number; // serial, primary key
  user_id?: string; // uuid, references users(id)
  full_name?: string; // text
  street?: string; // text
  city?: string; // text
  state?: string; // text
  zip?: string; // text
  country?: string; // text
  phone?: string; // text
  is_default: boolean; // boolean, default false
}

export interface SupabaseReview {
  id: number; // serial, primary key
  user_id?: string; // uuid, references users(id)
  product_id?: string; // uuid, references products(id)
  rating?: number; // integer, check (rating between 1 and 5)
  comment?: string; // text
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

export interface SupabaseWishlistItemEntry { // Renamed to avoid clash with UI WishlistItem
  id: number; // serial, primary key
  user_id?: string; // uuid, references users(id)
  product_id?: string; // uuid, references products(id)
  added_at: string; // timestamp
}

// Note: The following types from a previous schema iteration are no longer present
// in the latest SQL and are thus removed:
// - SupabaseCartItem (cart logic might be handled differently or client-side before order creation)
// - DraftOrder
// - DraftOrderItem
// - RefundRequest (schema name 'refunds' is not present in the latest user-provided SQL)
// - InventoryAlert
// - ManualOrder
// - ManualOrderItem
// If 'refunds' table was intended to be `refund_requests`, it would need to be re-added.
// The current 'cart_items' table from the first SQL provided by user is also not in the latest SQL.
// The latest SQL only has 'orders' and 'order_items'. Client-side cart state will be used until an order is created.

// Mock type used in frontend for Order History page display, can be adapted
// once SupabaseOrder and SupabaseOrderItem are fetched and combined.
export interface DisplayOrder {
  id: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | string; // Allow for Supabase statuses
  totalAmount: number;
  items: Array<{ // This structure is for display, derived from SupabaseOrderItem & SupabaseProduct
    id: string; // Product ID
    name: string;
    quantity: number;
    price: number; // Price per item at time of order
    image: string;
    'data-ai-hint': string;
  }>;
}
