
import type { Product, SectionCategory } from '@/types';
import { LayoutGrid, SprayCan, Sparkles, Gem } from 'lucide-react';

export const cosmeticsCategories: SectionCategory[] = [
  { value: 'all', label: 'All', icon: LayoutGrid },
  { value: 'skincare', label: 'Skincare', icon: SprayCan },
  { value: 'makeup', label: 'Makeup', icon: Sparkles },
  { value: 'fragrance', label: 'Fragrance', icon: Gem },
];

// Products will be added by the admin via the UI
export const cosmeticsProducts: Product[] = [];
