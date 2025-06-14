
import type { Product, SectionCategory } from '@/types';
import { LayoutGrid, Drumstick, Carrot, Grape, Cookie } from 'lucide-react';

export const groceryCategories: SectionCategory[] = [
  { value: 'all', label: 'All', icon: LayoutGrid },
  { value: 'meats', label: 'Meats', icon: Drumstick },
  { value: 'vegetables', label: 'Vegetables', icon: Carrot },
  { value: 'fruits', label: 'Fruits', icon: Grape },
  { value: 'breads', label: 'Breads', icon: Cookie },
];

// Products will be added by the admin via the UI
export const groceryProducts: Product[] = [];
