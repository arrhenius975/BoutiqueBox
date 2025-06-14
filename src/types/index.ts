
// Represents sub-categories within a main section (Grocery, Cosmetics, FastFood)
// 'all' is a general filter, specific sub-categories follow.
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

export interface Product {
  id: string; // Changed to string to represent UUID from Supabase
  name: string;
  description: string;
  price: number;
  image: string;
  category: ProductCategory; // This is the sub-category
  'data-ai-hint': string;
}

// Frontend CartItem type, extends Product for UI convenience
export interface CartItem extends Product {
  quantity: number;
}

export interface WishlistItem extends Product {}

// Represents the main sections of the app
export type AppSection = 'grocery' | 'cosmetics' | 'fastfood';

export interface SectionCategory {
  value: ProductCategory;
  label: string;
  icon: React.ElementType; // Lucide icon component
}

export interface SectionConfig {
  name: string;
  path: string;
  themeClass: string;
  products: Product[];
  categories: SectionCategory[];
  hero: {
    title: string;
    subtitle: string;
  };
}

export type SearchFilterType = 'all' | 'name' | 'description';

// Added for Admin/Order features (mock structures)
export interface AdminUser { // This is a frontend type, actual Supabase user might be different
  id: string;
  email: string;
  role: 'admin' | 'editor'; // Example roles
}

export interface OrderItemSummary {
  productId: string; // Represents Product['id'] (UUID)
  name: string;
  quantity: number;
  price: number; // Price at time of purchase
  image: string;
}
export interface Order {
  id: string; // Represents Order UUID from Supabase
  userId: string; // Link to user UUID
  date: string; // ISO date string
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItemSummary[];
  totalAmount: number;
  shippingAddress: string; // Simplified
}

export interface Review { // This is a frontend type, Supabase table 'reviews' might be different
  id: string; // Represents Review ID
  productId: string; // Product UUID
  userId: string; // User UUID
  authorName: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO date string
}

// --- Supabase Specific Types based on SQL Schema ---

export interface SupabaseUser {
  id: string; // uuid, primary key
  auth_id: string; // uuid, Supabase Auth link
  email: string;
  name?: string;
  role: 'admin' | 'staff' | 'customer' | string; // Role can be extended
  created_at: string; // timestamp
}

// Supabase cart_items table type
export interface SupabaseCartItem {
  id: number; // serial primary key
  user_id: string; // uuid, references users(id)
  product_id: string; // uuid, references products(id)
  quantity: number;
  added_at: string; // timestamp
}

export interface DraftOrder {
  id: string; // uuid, primary key
  user_id: string; // uuid, references users(id)
  status: string; // e.g., 'draft'
  created_at: string; // timestamp
}

export interface DraftOrderItem {
  id: number; // serial primary key
  draft_order_id: string; // uuid, references draft_orders(id)
  product_id: string; // uuid, references products(id)
  quantity: number;
}

export interface RefundRequest {
  id: number; // serial primary key
  order_id: string; // uuid, references orders(id)
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  requested_at: string; // timestamp
  resolved_at?: string; // timestamp
}

export interface InventoryAlert {
  id: number; // serial primary key
  product_id: string; // uuid, references products(id)
  threshold: number;
  alerted: boolean;
}

export interface ManualOrder {
  id: string; // uuid, primary key
  created_by: string; // uuid, references users(id) (admin/staff who created it)
  user_id: string; // uuid, references users(id) (customer for whom it was created)
  total_amount: number; // numeric(10, 2)
  note?: string;
  created_at: string; // timestamp
}

export interface ManualOrderItem {
  id: number; // serial primary key
  manual_order_id: string; // uuid, references manual_orders(id)
  product_id: string; // uuid, references products(id)
  quantity: number;
  price: number; // numeric(10, 2)
}
