
import type { Product, SectionCategory } from '@/types';
import { LayoutGrid, Utensils, Pizza, CupSoda, Vegan } from 'lucide-react';

export const fastfoodCategories: SectionCategory[] = [
  { value: 'all', label: 'All', icon: LayoutGrid },
  { value: 'burgers', label: 'Burgers', icon: Utensils },
  { value: 'pizza', label: 'Pizza', icon: Pizza },
  { value: 'sides', label: 'Sides', icon: Vegan },
  { value: 'drinks', label: 'Drinks', icon: CupSoda },
];

// Products will be added by the admin via the UI
export const fastfoodProducts: Product[] = [];
