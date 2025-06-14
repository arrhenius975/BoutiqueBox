
// src/app/admin/products/page.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, Search, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Product, ProductCategory, AppSection } from '@/types';
import { ProductForm, type ProductFormSubmitData } from './components/ProductForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/data/supabase';
import { useToast } from '@/hooks/use-toast';

// Mock Data - In a real app, this would come from your database via an API
const mockProducts: Product[] = [
  { id: 'g-m1', name: 'Chicken Breast', description: 'Boneless, skinless chicken breast, 1 lb.', price: 7.99, image: 'https://placehold.co/100x100.png', category: 'meats', 'data-ai-hint': 'chicken' },
  { id: 'c-s1', name: 'Hydrating Face Cream', description: 'Rich moisturizing cream, 50ml.', price: 24.99, image: 'https://placehold.co/100x100.png', category: 'skincare', 'data-ai-hint': 'cream' },
  { id: 'ff-b1', name: 'Classic Cheeseburger', description: 'Juicy beef patty, cheddar cheese.', price: 8.99, image: 'https://placehold.co/100x100.png', category: 'burgers', 'data-ai-hint': 'burger' },
  { id: 'g-v1', name: 'Beetroot', description: 'Fresh organic beetroot, bunch of 3.', price: 2.99, image: 'https://placehold.co/100x100.png', category: 'vegetables', 'data-ai-hint': 'beetroot' },
];

const allPossibleCategories: { value: ProductCategory; label: string; section: AppSection }[] = [
  { value: 'meats', label: 'Meats', section: 'grocery' },
  { value: 'vegetables', label: 'Vegetables', section: 'grocery' },
  { value: 'fruits', label: 'Fruits', section: 'grocery' },
  { value: 'breads', label: 'Breads', section: 'grocery' },
  { value: 'skincare', label: 'Skincare', section: 'cosmetics' },
  { value: 'makeup', label: 'Makeup', section: 'cosmetics' },
  { value: 'fragrance', label: 'Fragrance', section: 'cosmetics' },
  { value: 'burgers', label: 'Burgers', section: 'fastfood' },
  { value: 'pizza', label: 'Pizza', section: 'fastfood' },
  { value: 'sides', label: 'Sides', section: 'fastfood' },
  { value: 'drinks', label: 'Drinks', section: 'fastfood' },
];


export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product? This is a UI demo.")) {
      setProducts(products.filter(p => p.id !== productId));
      toast({ title: "Product Deleted (UI Demo)", description: `Product ${productId} removed from list.` });
      // In real app: await supabase.from('products').delete().eq('id', productId);
      // And delete associated images from storage.
    }
  };

  const handleFormSubmit = async (data: ProductFormSubmitData) => {
    setIsSubmitting(true);
    let imageUrl = data.currentImageUrl || 'https://placehold.co/100x100.png';
    const productId = data.id || `prod-${Date.now()}`; // Use existing ID or generate one for path

    if (data.imageFile) {
      const file = data.imageFile;
      // Sanitize filename, replace spaces with underscores, and ensure it's relatively safe
      const safeFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = `${productId}/${safeFileName}`; 
      
      const loadingToast = toast({ title: "Uploading image...", description: "Please wait.", duration: Infinity });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      loadingToast.dismiss();

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        toast({ title: 'Image Upload Failed', description: uploadError.message, variant: 'destructive' });
        setIsSubmitting(false);
        return; // Stop if image upload fails
      } else if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);
        imageUrl = urlData.publicUrl;
        toast({ title: 'Image Uploaded Successfully!', description: `Image available at new URL.` });
      }
    }

    const productData: Product = {
      id: productId,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      category: data.category,
      image: imageUrl,
      'data-ai-hint': data['data-ai-hint'] || data.name.toLowerCase().split(' ')[0] || 'product',
    };

    if (data.id) { // Editing existing product
      setProducts(products.map(p => (p.id === data.id ? productData : p)));
      toast({ title: "Product Updated (UI Demo)", description: `${productData.name} has been updated.` });
      // In real app: await supabase.from('products').update({ ...productData }).eq('id', data.id);
      // And update product_images table if primary image URL changed.
    } else { // Adding new product
      setProducts([productData, ...products]);
      toast({ title: "Product Added (UI Demo)", description: `${productData.name} has been added.` });
      // In real app: await supabase.from('products').insert({ ...productData });
      // And insert into product_images table.
    }

    setIsSubmitting(false);
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Product Management</h1>
          <p className="text-muted-foreground">Add, edit, or remove products from your store.</p>
        </div>
        <Button onClick={handleAddProduct} size="lg" disabled={isSubmitting}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            A list of all products currently in your inventory. Use the filters to narrow down your search.
          </CardDescription>
           <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as ProductCategory | 'all')}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allPossibleCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label} ({cat.section})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden lg:table-cell w-[30%]">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image ? (
                       <Image src={product.image} alt={product.name} width={48} height={48} className="rounded-md object-cover aspect-square" data-ai-hint={product['data-ai-hint'] || 'product'}/>
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground"/>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {allPossibleCategories.find(c => c.value === product.category)?.label || product.category}
                  </TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-xs">{product.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)} title="Edit" disabled={isSubmitting}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteProduct(product.id)} title="Delete" disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        if (isSubmitting) return; // Prevent closing while submitting
        setIsFormOpen(isOpen);
        if (!isOpen) setEditingProduct(null);
      }}>
        <DialogContent className="sm:max-w-2xl p-0">
          {isFormOpen && (
            <ProductForm
              product={editingProduct}
              onSubmit={handleFormSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }}
              availableCategories={allPossibleCategories.map(c => ({value: c.value, label: `${c.label} (${c.section})`}))}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground text-center">
        Product management interactions are UI demonstrations. Full CRUD operations and image persistence require backend and database integration with Supabase.
      </p>
    </div>
  );
}
