
// src/app/admin/products/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, Search, Image as ImageIcon, Loader2, Package } from 'lucide-react';
import type { Product, SupabaseCategory as AdminUICategoryType } from '@/types';
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<AdminUICategoryType[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchProductCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch('/api/categories'); // This fetches all categories
      if (!response.ok) {
        let errorDetail = `Server responded with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorData.message || errorDetail;
        } catch (e) {
          const textError = await response.text().catch(() => '');
          if (textError) errorDetail += ` - Response: ${textError.substring(0, 100)}...`;
        }
        throw new Error(errorDetail);
      }
      const data: AdminUICategoryType[] = await response.json();
      setAllCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch categories error:", error);
      toast({ title: "Error Fetching Categories", description: (error as Error).message, variant: "destructive" });
      setAllCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [toast]);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch('/api/products'); // Fetches all products
      if (!response.ok) {
        let errorDetail = `Server responded with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorData.message || errorDetail;
        } catch (e) {
          const textError = await response.text().catch(() => '');
          if (textError) errorDetail += ` - Response: ${textError.substring(0, 100)}...`;
        }
        throw new Error(errorDetail);
      }
      const rawData = await response.json();
      const dataToFormat = Array.isArray(rawData) ? rawData : [];

      // Transform raw Supabase product data to frontend Product type
      const formattedProducts: Product[] = dataToFormat.map((p: any) => {
        const primaryImage = p.product_images?.find((img: any) => img.is_primary === true)?.image_url;
        const categoryName = p.category_id?.name || 'Uncategorized'; // Use joined category name
        const categoryId = p.category_id?.id; // Use joined category id

        return {
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: parseFloat(p.price) || 0,
          stock: parseInt(p.stock, 10) || 0,
          category: categoryName, // This is the string name for display
          category_id: categoryId, // This is the actual ID
          image: primaryImage || `https://placehold.co/100x100.png?text=${p.name.substring(0,1).toUpperCase()}`,
          'data-ai-hint': p.name.toLowerCase().split(' ').slice(0,2).join(' ') || 'product item', // Construct a hint if DB one is not used/available
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
  }, [toast]);

  useEffect(() => {
    fetchProductCategories();
    fetchProducts();
  }, [fetchProductCategories, fetchProducts]);


  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete product and parse error response.' }));
        throw new Error(errorData.error || 'Failed to delete product');
      }

      await fetchProducts(); // Refetch products to update the list
      toast({ title: "Product Deleted", description: `Product has been removed.` });
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
    const isUpdating = !!data.id;
    const actionVerb = isUpdating ? "Updating" : "Adding";
    const loadingToastId = toast({
        title: `${actionVerb} product...`,
        description: "Please wait.",
        duration: Infinity
    }).id;

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price);
    formData.append('stock', data.stock);

    if (data.category_id) {
      formData.append('category_id', data.category_id.toString());
    } else {
      toast({ title: "Category Error", description: "Category ID is missing.", variant: "destructive" });
      setIsSubmitting(false);
      if(loadingToastId) toast.dismiss(loadingToastId);
      return;
    }
    
    // Handle brand_id - it's optional. ProductForm doesn't have a field for it yet.
    // If you add brand_id to ProductFormSubmitData, you can append it here:
    // if (data.brand_id) formData.append('brand_id', data.brand_id.toString());
    // For now, the API will handle it as NULL if not sent or if it's an empty string.

    if (data.imageFile) {
      formData.append('imageFile', data.imageFile, data.imageFile.name);
    }
    if (isUpdating && data.currentImageUrl && !data.imageFile) {
        // No need to append currentImageUrl, API PUT logic will preserve it if no new file
    }
    
    // data_ai_hint is not sent to API for products table to avoid "column does not exist" if schema is not updated.
    // It is used for UI hints only.

    try {
      let response;
      let url = '/api/products';
      let method = 'POST';

      if (isUpdating) {
        url = `/api/products/${data.id}`;
        method = 'PUT';
      }

      response = await fetch(url, {
        method: method,
        body: formData, // Sending as FormData for file upload
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error during product ${isUpdating ? 'update' : 'creation'}.` }));
        throw new Error(errorData.error || `Failed to ${isUpdating ? 'update' : 'add'} product`);
      }

      const result = await response.json();
      if (result.success) {
        toast({ title: `Product ${isUpdating ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isUpdating ? 'updated' : 'added'}.` });
        await fetchProducts(); // Refetch products
        setIsFormOpen(false);
        setEditingProduct(null);
      } else {
        throw new Error(result.error || `Unknown error from API after ${isUpdating ? 'updating' : 'adding'} product.`);
      }

    } catch (error) {
      console.error(`Product ${isUpdating ? 'update' : 'submission'} error:`, error);
      toast({ title: `Product ${isUpdating ? 'Update' : 'Add'} Failed`, description: (error as Error).message, variant: "destructive" });
    } finally {
      if(loadingToastId) toast.dismiss(loadingToastId);
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || descriptionMatch;
    const matchesCategory = filterCategoryId === 'all' || (product.category_id && product.category_id.toString() === filterCategoryId);
    return matchesSearch && matchesCategory;
  });

  const formSelectableCategories = allCategories.map(cat => ({
    value: cat.id, // Use numeric ID
    label: cat.name,
  }));


  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Product Management</h1>
          <p className="text-muted-foreground">Add, edit, or remove products from your store.</p>
        </div>
        <Button 
          onClick={handleAddProduct} 
          size="lg" 
          disabled={isSubmitting || ((isLoadingProducts || isLoadingCategories) && products.length === 0 && allCategories.length === 0 && !isSubmitting)}
        >
          {((isLoadingProducts || isLoadingCategories) && products.length === 0 && allCategories.length === 0 && !isSubmitting) ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
          Add New Product
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
                disabled={((isLoadingProducts || isLoadingCategories) && products.length === 0 && allCategories.length === 0)}
              />
            </div>
            <Select
                value={filterCategoryId}
                onValueChange={(value) => setFilterCategoryId(value)}
                disabled={((isLoadingProducts || isLoadingCategories) && products.length === 0 && allCategories.length === 0) || isLoadingCategories}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={isLoadingCategories && allCategories.length === 0 ? "Loading categories..." : "Filter by category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProducts || isLoadingCategories ? (
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
                <TableHead>Stock</TableHead>
                <TableHead className="hidden lg:table-cell w-[25%]">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image && product.image !== `https://placehold.co/100x100.png?text=${product.name.substring(0,1).toUpperCase()}` ? (
                       <Image src={product.image} alt={product.name} width={48} height={48} className="rounded-md object-cover aspect-square" data-ai-hint={product['data-ai-hint'] || 'product'}/>
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground"/>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                     {product.category}
                  </TableCell>
                  <TableCell>₹{product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${product.stock <= 5 ? 'text-destructive' : (product.stock <= 20 ? 'text-yellow-600' : 'text-green-600')}`}>
                        {product.stock !== undefined ? product.stock : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-xs">{product.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)} title="Edit Product" disabled={isSubmitting}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteProduct(product.id)} title="Delete Product" disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {(isLoadingProducts || isLoadingCategories) ? "Loading..." : products.length === 0 && !searchTerm && filterCategoryId === 'all' ? "No products yet. Click 'Add New Product' to get started!" : "No products found matching your search or filter."}
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
          {isFormOpen && ( // Conditionally render Form to reset state on close/reopen
            <ProductForm
              product={editingProduct}
              onSubmit={handleFormSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }}
              availableCategories={formSelectableCategories}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground text-center">
        Product management interacts with API endpoints. Ensure backend and Supabase (RLS, Storage policies) are configured. Brands need to be added to the form for full functionality.
      </p>
    </div>
  );
}

