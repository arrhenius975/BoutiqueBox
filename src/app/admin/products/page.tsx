
// src/app/admin/products/page.tsx
"use client";

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';

// --- IMPORTANT ---
// This `allPossibleCategories` array MUST be updated to reflect your actual `categories` table in Supabase.
// The `id` MUST match the `id` from your database.
// The `value` is a string identifier used internally by the frontend (must be unique and part of ProductCategory type).
// The `label` is what users see in the dropdown.
// The `section` helps group categories visually in the dropdown (must be part of AppSection type).
//
// Example structure after fetching from your DB (SELECT id, name FROM categories;):
// If DB has: { id: 1, name: 'Fresh Meats' }, { id: 2, name: 'Organic Vegetables' }
// Your array here should be:
// { id: 1, value: 'meats', label: 'Fresh Meats', section: 'grocery' },
// { id: 2, value: 'vegetables', label: 'Organic Vegetables', section: 'grocery' },
// ... and so on for all your categories.
// -----------------
const allPossibleCategories: { id: number; value: ProductCategory; label: string; section: AppSection }[] = [
  // Grocery (Existing examples - VERIFY/UPDATE IDs and labels)
  { id: 1, value: 'meats', label: 'Meats', section: 'grocery' },
  { id: 2, value: 'vegetables', label: 'Vegetables', section: 'grocery' },
  { id: 3, value: 'fruits', label: 'Fruits', section: 'grocery' },
  { id: 4, value: 'breads', label: 'Breads', section: 'grocery' },
  // Cosmetics (Existing examples - VERIFY/UPDATE IDs and labels)
  { id: 5, value: 'skincare', label: 'Skincare', section: 'cosmetics' },
  { id: 6, value: 'makeup', label: 'Makeup', section: 'cosmetics' },
  { id: 7, value: 'fragrance', label: 'Fragrance', section: 'cosmetics' },
  // Fast Food (Existing examples - VERIFY/UPDATE IDs and labels)
  { id: 8, value: 'burgers', label: 'Burgers', section: 'fastfood' },
  { id: 9, value: 'pizza', label: 'Pizza', section: 'fastfood' },
  { id: 10, value: 'sides', label: 'Sides', section: 'fastfood' },
  { id: 11, value: 'drinks', label: 'Drinks', section: 'fastfood' },
  // New example categories (REPLACE THESE WITH YOUR ACTUAL DB DATA AND IDs)
  { id: 100, value: 'electronics', label: 'Electronics', section: 'tech' },
  { id: 101, value: 'clothing', label: 'Clothing', section: 'fashion' },
  { id: 102, value: 'books', label: 'Books', section: 'literature' },
  { id: 103, value: 'all', label: 'Uncategorized', section: 'other' }, // Fallback if needed
];


export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch products and parse error' }));
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      const data = await response.json();
      
      const formattedProducts: Product[] = data.map((p: any) => {
        const dbCategoryId = p.category_id?.id;
        const matchedCategory = allPossibleCategories.find(cat => cat.id === dbCategoryId);
        const frontendCategory = matchedCategory?.value || 'all'; // Default to 'all' or handle as uncategorized

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: parseFloat(p.price), 
          category: frontendCategory as ProductCategory,
          image: p.product_images?.find((img: any) => img.is_primary)?.image_url || `https://placehold.co/100x100.png?text=${p.name.substring(0,1)}`,
          'data-ai-hint': p.data_ai_hint || p.name.toLowerCase().split(' ')[0] || 'product',
        };
      });
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Fetch products error:", error);
      toast({ title: "Error Fetching Products", description: (error as Error).message, variant: "destructive" });
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    toast({ title: "Edit Mode", description: "Editing opens the form pre-filled. API for update (PUT) is separate."});
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product? This will also remove associated images.")) return;
    
    setIsSubmitting(true);
    const loadingToastId = toast({ title: "Deleting product...", description: "Please wait.", duration: Infinity }).id;
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete product and parse error' }));
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      setProducts(products.filter(p => p.id !== productId)); // Optimistic update
      // fetchProducts(); // Or re-fetch for consistency
      toast({ title: "Product Deleted", description: `Product ${productId} has been removed.` });
    } catch (error) {
      console.error("Delete product error:", error);
      toast({ title: "Error Deleting Product", description: (error as Error).message, variant: "destructive" });
    } finally {
      if(loadingToastId) toast.dismiss(loadingToastId);
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: ProductFormSubmitData) => {
    setIsSubmitting(true);
    const loadingToastId = toast({ title: data.id ? "Updating product..." : "Adding new product...", description: "Please wait.", duration: Infinity }).id;

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price); 
    // formData.append('stock', data.stock || '0'); // Add if stock is managed

    const categoryDetails = allPossibleCategories.find(c => c.value === data.category);
    if (categoryDetails) {
      formData.append('category_id', categoryDetails.id.toString());
    } else {
      toast({ title: "Category Error", description: `Selected category "${data.category}" is not configured correctly. Please check admin settings.`, variant: "destructive" });
      setIsSubmitting(false);
      if(loadingToastId) toast.dismiss(loadingToastId);
      return;
    }
    formData.append('brand_id', '1'); // Mocking brand_id, replace with actual brand selection if implemented
    
    if (data.imageFile) {
      formData.append('imageFile', data.imageFile, data.imageFile.name);
    }
    
    formData.append('dataAiHint', data['data-ai-hint'] || data.name.toLowerCase().split(' ')[0] || 'product');

    try {
      let response;
      if (data.id) {
        // UPDATE (PUT) LOGIC - Not yet implemented fully.
        // You would typically make a PUT request to /api/products/${data.id}
        toast({ title: "Update Not Implemented", description: "Product update API endpoint is not specified yet. This is a UI mock.", variant: "default" });
        const productData: Product = {
            id: data.id,
            name: data.name,
            description: data.description,
            price: parseFloat(data.price),
            category: data.category,
            image: data.imageFile ? URL.createObjectURL(data.imageFile) : data.currentImageUrl || `https://placehold.co/100x100.png?text=${data.name.substring(0,1)}`,
           'data-ai-hint': data['data-ai-hint'] || data.name.toLowerCase().split(' ')[0] || 'product',
        };
        setProducts(products.map(p => (p.id === data.id ? productData : p)));
      } else {
        // CREATE (POST) LOGIC
        response = await fetch('/api/products', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Server error during product creation.' }));
          throw new Error(errorData.error || 'Failed to add product');
        }
        
        const result = await response.json();
        if (result.success && result.product) {
          toast({ title: "Product Added", description: `${result.product.name} has been successfully added.` });
          fetchProducts(); 
        } else {
          throw new Error(result.error || "Unknown error from API after adding product.");
        }
      }

    } catch (error) {
      console.error("Product submission error:", error);
      toast({ title: `Product ${data.id ? 'Update' : 'Add'} Failed`, description: (error as Error).message, variant: "destructive" });
    } finally {
      if(loadingToastId) toast.dismiss(loadingToastId);
      setIsSubmitting(false);
      setIsFormOpen(false); 
      setEditingProduct(null);
    }
  };

  const filteredProducts = products.filter(product => {
    const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || descriptionMatch;
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Filter out 'all' from category options for the form's dropdown
  const formSelectableCategories = allPossibleCategories
    .filter(cat => cat.value !== 'all') // Ensure 'all' is not a selectable category in the form
    .map(c => ({
      value: c.value, 
      label: `${c.label} (${c.section})` // Example: "Meats (grocery)"
    }));


  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Product Management</h1>
          <p className="text-muted-foreground">Add, edit, or remove products from your store.</p>
        </div>
        <Button onClick={handleAddProduct} size="lg" disabled={isSubmitting || isLoadingProducts}>
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
                {/* Use formSelectableCategories which are filtered and formatted for display */}
                {formSelectableCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
          ) : (
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
                    No products found. Try adjusting your search or filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        if (isSubmitting) return; 
        setIsFormOpen(isOpen);
        if (!isOpen) setEditingProduct(null);
      }}>
        <DialogContent className="sm:max-w-2xl p-0">
          {isFormOpen && (
            <ProductForm
              product={editingProduct}
              onSubmit={handleFormSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }}
              availableCategories={formSelectableCategories} // Use the filtered list for the form
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground text-center">
        Product management interacts with API endpoints. Ensure backend and Supabase are configured.
      </p>
    </div>
  );
}

    
