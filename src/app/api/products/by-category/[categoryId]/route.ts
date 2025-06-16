
// src/app/api/products/by-category/[categoryId]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Product } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { categoryId } = params;
    const id = parseInt(categoryId);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid category ID format.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        stock,
        category_id,
        categories ( name ),
        brand_id ( id, name ),
        product_images ( image_url, is_primary ),
        data_ai_hint
      `)
      .eq('category_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching products for category_id ${id}:`, error);
      return NextResponse.json({ error: error.message || 'Failed to fetch products.' }, { status: 500 });
    }

    // Format data to match the frontend Product type as closely as possible
    const formattedProducts: Product[] = data.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      stock: p.stock || 0,
      // @ts-ignore - category_id is directly on p, categories table is joined for name
      category: p.categories?.name || 'Unknown Category',
      category_id: p.category_id, // Keep the actual category_id
      image: p.product_images?.find((img: any) => img.is_primary)?.image_url || `https://placehold.co/300x200.png?text=${encodeURIComponent(p.name.substring(0,2))}`,
      'data-ai-hint': p.data_ai_hint || p.name.toLowerCase().split(' ').slice(0,2).join(' ') || 'product',
    }));

    return NextResponse.json(formattedProducts);

  } catch (e: unknown) {
    console.error('GET /api/products/by-category/[categoryId] general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
