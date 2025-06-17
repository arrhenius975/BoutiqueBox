
// src/app/api/products/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to check admin role
async function isAdmin(supabaseClient: ReturnType<typeof createRouteHandlerClient>): Promise<boolean> {
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) return false;

  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
  
  return !profileError && profile?.role === 'admin';
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (!await isAdmin(supabase)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const stockStr = formData.get('stock') as string | null; 
    const category_id_str = formData.get('category_id') as string;
    const brand_id_str = formData.get('brand_id') as string | null; 
    const dataAiHint = formData.get('data_ai_hint') as string | null; 

    const imageFile = formData.get('imageFile') as File | null;

    if (!name || !priceStr || !category_id_str || !stockStr) { 
        return NextResponse.json({ error: 'Missing required fields: name, price, stock, category_id' }, { status: 400 });
    }
    if (!imageFile || imageFile.size === 0) {
       return NextResponse.json({ error: 'Product image is required for new products and cannot be empty.' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    const stock = parseInt(stockStr, 10);
    const category_id = parseInt(category_id_str, 10);
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '') ? parseInt(brand_id_str, 10) : null;

    if (isNaN(price) || price <= 0) {
        return NextResponse.json({ error: 'Invalid price value. Must be a number greater than 0.' }, { status: 400 });
    }
    if (isNaN(stock) || stock < 0) {
        return NextResponse.json({ error: 'Invalid stock value. Must be a non-negative number.' }, { status: 400 });
    }
    if (isNaN(category_id)) {
        return NextResponse.json({ error: 'Invalid category_id. Must be a number.' }, { status: 400 });
    }
    if (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && isNaN(brand_id as number)) {
        return NextResponse.json({ error: 'Invalid numeric value for brand_id' }, { status: 400 });
    }
    if (imageFile.size > 2 * 1024 * 1024) { // 2MB limit
        return NextResponse.json({ error: 'Image file too large (max 2MB).' }, { status: 413 });
    }


    const productInsertPayload: {
        name: string;
        description?: string;
        price: number;
        stock: number;
        category_id: number;
        brand_id?: number | null;
        data_ai_hint?: string | null;
    } = {
        name: name.trim(),
        description: description?.trim() || undefined,
        price,
        stock,
        category_id,
        brand_id: brand_id,
        data_ai_hint: dataAiHint?.trim() || name.trim().toLowerCase().split(" ")[0] || "product"
    };

    const { data: productData, error: productInsertError } = await supabase
      .from('products')
      .insert([productInsertPayload])
      .select()
      .single();

    if (productInsertError || !productData) {
      console.error('Product insert error:', productInsertError);
      if (productInsertError?.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: `Product creation failed: A product with similar unique details (e.g., name if unique constraint exists) might already exist. ${productInsertError.details || productInsertError.message}` }, { status: 409 });
      }
      if (productInsertError?.code === '23503') { // Foreign key violation (e.g. category_id or brand_id does not exist)
         return NextResponse.json({ error: `Product creation failed: Invalid category or brand specified. ${productInsertError.details || productInsertError.message}` }, { status: 400 });
      }
      return NextResponse.json({ error: productInsertError?.message || 'Product insertion failed. Please check data and try again.' }, { status: 500 });
    }

    let publicUrl = `https://placehold.co/400x300.png?text=${encodeURIComponent(name.substring(0,2))}`; 

    if (imageFile && imageFile.size > 0) {
        const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filePath = `${productData.id}/${Date.now()}-${sanitizedFileName}`; 

        const { error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(filePath, imageFile, { upsert: true, contentType: imageFile.type });

        if (uploadErr) {
            console.error('Image upload error:', uploadErr);
            // Attempt to delete the product record if image upload fails, as image is mandatory for new products
            await supabase.from('products').delete().eq('id', productData.id);
            return NextResponse.json({ error: `Image upload failed: ${uploadErr.message}. Product creation has been rolled back.` }, { status: 500 });
        }

        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
            console.error('Failed to get public URL for uploaded image:', filePath);
            await supabase.from('products').delete().eq('id', productData.id); // Rollback
            return NextResponse.json({ error: `Image uploaded, but failed to retrieve public URL. Product creation rolled back.` }, { status: 500 });
        }
        publicUrl = urlData.publicUrl;

        const { error: productImageInsertError } = await supabase.from('product_images').insert({
            product_id: productData.id,
            image_url: publicUrl,
            is_primary: true
        });

        if (productImageInsertError) {
            console.error('Product image DB insert error:', productImageInsertError);
            // Attempt to rollback product and storage image
            await supabase.storage.from('product-images').remove([filePath]);
            await supabase.from('products').delete().eq('id', productData.id);
            return NextResponse.json({ error: `Image uploaded, but linking image to product failed: ${productImageInsertError.message}. Product creation rolled back.` }, { status: 500 });
        }
    } else {
        // This case should ideally not be hit if image is mandatory as per prior checks.
        // If it were optional, this is where placeholder logic would go.
        // For now, we assume imageFile is present and valid.
    }
    
    const { data: finalProductData, error: finalFetchError } = await supabase
      .from('products')
      .select(\`
        id,
        name,
        description,
        price,
        stock,
        category_id ( id, name ),
        brand_id ( id, name ),
        product_images ( image_url, is_primary ),
        data_ai_hint
      \`)
      .eq('id', productData.id)
      .single();

    if (finalFetchError || !finalProductData) {
        console.error('Failed to refetch product details after creation:', finalFetchError);
        // Product and image were created, but refetch failed. This is a partial success.
        // It's better to return the initial productData and alert admin if necessary.
        return NextResponse.json({ 
            success: true, 
            product: { ...productData, image: publicUrl, category: { name: 'Category name fetch pending'} },
            warning: 'Product created, but full details could not be immediately refetched.'
        }, { status: 201 });
    }

    return NextResponse.json({ success: true, product: finalProductData }, { status: 201 });
  } catch (e: unknown) {
    console.error('POST /api/products unexpected error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during product creation.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Optional: Add admin check if all products list should be admin-only
  // if (!await isAdmin(supabase)) {
  //   return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  // }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(\`
        id,
        name,
        description,
        price,
        stock,
        category_id ( id, name ),
        brand_id ( id, name ),
        product_images ( image_url, is_primary ),
        data_ai_hint
      \`)
      .order('created_at', { ascending: false });


    if (error) {
      console.error('GET /api/products error:', error);
      return NextResponse.json({ error: `Failed to fetch products: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (e: unknown) {
    console.error('GET /api/products general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while fetching products.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    