
// src/app/[section]/[productId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, AppSection } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ReviewsSection } from '@/components/ReviewsSection'; // Placeholder
import { Loader2, ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import { groceryProducts } from '@/data/groceryProducts';
import { cosmeticsProducts } from '@/data/cosmeticsProducts';
import { fastfoodProducts } from '@/data/fastfoodProducts';

const allProductsData: Record<AppSection, Product[]> = {
  grocery: groceryProducts,
  cosmetics: cosmeticsProducts,
  fastfood: fastfoodProducts,
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    addToCart, 
    addToWishlist, 
    wishlist, 
    addToViewedProducts,
    currentSection, // Use AppContext's currentSection
    setSelectedCategory // To clear category selection if needed
  } = useAppContext();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const section = params?.section as AppSection | undefined;
  const productId = params?.productId as string | undefined;

  useEffect(() => {
    if (section && productId) {
      // Simulate fetching product data
      // In a real app, this would be an API call: fetch(`/api/products/${section}/${productId}`)
      setIsLoading(true);
      const sectionProducts = allProductsData[section];
      const foundProduct = sectionProducts?.find(p => p.id === productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
        addToViewedProducts(foundProduct.id); // Track viewed product
      } else {
        // Handle product not found, maybe redirect or show error
        console.error(`Product ${productId} not found in section ${section}`);
        router.push(`/${section}`); // Redirect to section page if product not found
      }
      setIsLoading(false);
    }
  }, [section, productId, addToViewedProducts, router]);

  useEffect(() => {
    // Clear category selection when on a product detail page
    // as category filters are for the main grid, not this page.
    setSelectedCategory('all');
  }, [setSelectedCategory]);


  if (isLoading || !product) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isWishlisted = wishlist.some(item => item.id === product.id);

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.back()} className="mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to {currentSection || section || 'Products'}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg border">
          <Image
            src={product.image}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            priority // Prioritize loading main product image
            data-ai-hint={product['data-ai-hint'] || 'product detail'}
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-center">
          <h1 className="font-headline text-3xl md:text-4xl font-bold mb-3 text-foreground">{product.name}</h1>
          <p className="text-2xl font-semibold text-primary mb-4">₹{product.price.toFixed(2)}</p>
          <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button size="lg" className="flex-1" onClick={() => addToCart(product)}>
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button
              size="lg"
              variant={isWishlisted ? "secondary" : "outline"}
              className="flex-1"
              onClick={() => addToWishlist(product)}
              aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart className={`mr-2 h-5 w-5 ${isWishlisted ? 'fill-destructive text-destructive' : ''}`} />
              {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Category:</strong> <span className="capitalize">{product.category}</span></p>
            <p><strong>Availability:</strong> In Stock</p> 
            {/* Placeholder - real availability would come from backend */}
          </div>
        </div>
      </div>
      
      <ReviewsSection productId={product.id} />
    </div>
  );
}
