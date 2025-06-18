
"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Product } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, addToWishlist, addToViewedProducts, wishlist } = useAppContext();

  const handleCardClick = () => {
    addToViewedProducts(product.id);
  };

  const isWishlisted = wishlist.some(item => item.id === product.id);

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg" onClick={handleCardClick}>
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] w-full">
          <Image 
            src={product.image} 
            alt={product.name} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint={product['data-ai-hint']}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="font-headline text-lg mb-1">{product.name}</CardTitle>
        <p className="text-primary font-semibold text-base mb-2">₹{product.price.toFixed(2)}</p>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">{product.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        <Button className="w-full" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
        <Button 
          variant={isWishlisted ? "secondary" : "outline"} 
          size="icon" 
          onClick={(e) => { e.stopPropagation(); addToWishlist(product); }}
          aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-destructive text-destructive' : ''}`} />
        </Button>
      </CardFooter>
    </Card>
  );
}
