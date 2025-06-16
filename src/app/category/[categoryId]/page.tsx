
// src/app/category/[categoryId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Product, SupabaseCategory } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/ProductGrid';
import { Loader2, ArrowLeft, AlertTriangle, Lightbulb } from 'lucide-react';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    addToViewedProducts,
    searchTerm,
    searchFilterType,
    fetchRecommendations, // Using generic recommendations
    isLoadingRecommendations,
    setSelectedCategory: setAppContextSelectedCategory // Renamed to avoid conflict
  } = useAppContext();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<SupabaseCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryId = params?.categoryId as string | undefined;

  useEffect(() => {
    // When on a specific category page, clear any global sub-category filter from AppContext
    // as this page itself is the category filter.
    setAppContextSelectedCategory('all');
  }, [setAppContextSelectedCategory]);

  useEffect(() => {
    if (categoryId) {
      const fetchCategoryData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Fetch category details (name, description)
          const catDetailsResponse = await fetch(`/api/categories`); // Assuming this endpoint can fetch all, or modify to fetch one
          if (!catDetailsResponse.ok) throw new Error('Failed to fetch category details.');
          const allCategories: SupabaseCategory[] = await catDetailsResponse.json();
          const foundCategory = allCategories.find(c => c.id.toString() === categoryId);
          
          if (!foundCategory) {
            throw new Error(`Category with ID ${categoryId} not found.`);
          }
          setCategoryDetails(foundCategory);

          // Fetch products for this category
          const productsResponse = await fetch(`/api/products/by-category/${categoryId}`);
          if (!productsResponse.ok) {
            const errorData = await productsResponse.json().catch(() => ({error: 'Failed to fetch products for this category.'}));
            throw new Error(errorData.error);
          }
          const productData: Product[] = await productsResponse.json();
          setProducts(productData);

          // Add first few products to viewed for recommendations
          if (productData.length > 0) {
            addToViewedProducts(productData[0].id);
            if (productData.length > 1) addToViewedProducts(productData[1].id);
          }

        } catch (err) {
          console.error(`Error fetching data for category ${categoryId}:`, err);
          setError((err as Error).message);
          setProducts([]);
          setCategoryDetails(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCategoryData();
    } else {
      setError("Category ID is missing.");
      setIsLoading(false);
    }
  }, [categoryId, addToViewedProducts]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let prods = products;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      prods = prods.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(lowerSearchTerm);
        const descriptionMatch = product.description.toLowerCase().includes(lowerSearchTerm);
        if (searchFilterType === 'name') return nameMatch;
        if (searchFilterType === 'description') return descriptionMatch;
        return nameMatch || descriptionMatch;
      });
    }
    return prods;
  }, [products, searchTerm, searchFilterType]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Category</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/sections')}>Back to Categories</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.push('/sections')} className="mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Categories
      </Button>

      {categoryDetails && (
        <section className="mb-12 text-center">
          <h1 className="font-headline text-4xl font-bold mb-3 text-primary">{categoryDetails.name}</h1>
          {categoryDetails.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {categoryDetails.description}
            </p>
          )}
        </section>
      )}
      
      <div id="product-grid-section">
        <ProductGrid products={filteredProducts} />
      </div>

      {filteredProducts.length > 0 && (
        <section className="mt-16 py-12 bg-secondary/50 rounded-lg text-center">
          <h2 className="font-headline text-3xl font-bold mb-4">You might also like</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Discover other products based on what you've seen in this category.
          </p>
          <Button size="lg" onClick={fetchRecommendations} disabled={isLoadingRecommendations}>
            <Lightbulb className="mr-2 h-5 w-5" />
            {isLoadingRecommendations ? 'Getting Suggestions...' : 'See Suggestions'}
          </Button>
        </section>
      )}
    </div>
  );
}
