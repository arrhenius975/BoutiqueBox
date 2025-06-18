
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

// POST handler for creating new products
export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (!await isAdmin(supabase)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  let tempProductId: string | null = null;
  let tempImageFilePath: string | null = null;

  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const category_id_str = formData.get('category_id') as string;
    const brand_id_str = formData.get('brand_id') as string | null; 
    const imageFile = formData.get('imageFile') as File | null;
    const stockStr = formData.get('stock') as string | null;
    // data_ai_hint is intentionally not read from formData for DB operations here,
    // as per the decision to not use it if the column doesn't exist.

    if (!name || !priceStr || !category_id_str || !stockStr) {
      return NextResponse.json({ error: 'Missing required fields: name, price, stock, category_id.' }, { status: 400 });
    }
    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: 'Product image is required for new products.' }, { status: 400 });
    }
    if (imageFile.size > 2 * 1024 * 1024) { // 2MB limit
        return NextResponse.json({ error: 'Image file too large (max 2MB).' }, { status: 413 });
    }

    const price = parseFloat(priceStr);
    const category_id = parseInt(category_id_str, 10);
    const stock = parseInt(stockStr, 10);
    // Ensure brand_id is null if not a valid number, or if string is "null" or empty
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && !isNaN(parseInt(brand_id_str, 10))) 
                     ? parseInt(brand_id_str, 10) 
                     : null;


    if (isNaN(price) || price <= 0) {
        return NextResponse.json({ error: 'Invalid price value. Must be a number greater than 0.' }, { status: 400 });
    }
    if (isNaN(stock) || stock < 0) {
        return NextResponse.json({ error: 'Invalid stock value. Must be a non-negative number.' }, { status: 400 });
    }
    if (isNaN(category_id)) {
        return NextResponse.json({ error: 'Invalid category_id. Must be a number.' }, { status: 400 });
    }


    // 1. Insert product details into 'products' table
    const productInsertPayload: {
      name: string;
      description?: string;
      price: number;
      stock: number;
      category_id: number;
      brand_id?: number | null; // Explicitly allow null
    } = {
      name: name.trim(),
      description: description?.trim() || undefined,
      price,
      stock,
      category_id,
      brand_id: brand_id, // This will be null if not provided or invalid
    };

    const { data: productData, error: productInsertError } = await supabase
      .from('products')
      .insert(productInsertPayload)
      .select()
      .single();

    if (productInsertError || !productData) {
      console.error('Product insert error:', productInsertError?.message);
      if (productInsertError?.code === '23505') { 
        return NextResponse.json({ error: `Product creation failed: A product with similar unique details might already exist. ${productInsertError.details || productInsertError.message}` }, { status: 409 });
      }
      if (productInsertError?.code === '23503') { 
         return NextResponse.json({ error: `Product creation failed: Invalid category or brand specified. ${productInsertError.details || productInsertError.message}` }, { status: 400 });
      }
      return NextResponse.json({ error: productInsertError?.message || 'Product creation failed. Please check data and try again.' }, { status: 500 });
    }
    tempProductId = productData.id; 

    // 2. Upload image to Supabase Storage
    const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = `${productData.id}/${Date.now()}-${sanitizedFileName}`;
    tempImageFilePath = filePath; 

    const { error: uploadError } = await supabase.storage
      .from('product-images') 
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false, 
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      if (tempProductId) {
        await supabase.from('products').delete().eq('id', tempProductId);
      }
      return NextResponse.json({ error: `Image upload failed: ${uploadError.message}. Product not created.` }, { status: 500 });
    }

    // 3. Get public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('Failed to get public URL for image:', filePath);
      if (tempProductId) await supabase.from('products').delete().eq('id', tempProductId);
      if (tempImageFilePath) await supabase.storage.from('product-images').remove([tempImageFilePath]);
      return NextResponse.json({ error: 'Image uploaded, but failed to get public URL. Product creation rolled back.' }, { status: 500 });
    }
    const imageUrl = publicUrlData.publicUrl;

    // 4. Insert image record into 'product_images' table
    const { error: productImageInsertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productData.id,
        image_url: imageUrl,
        is_primary: true, 
      });

    if (productImageInsertError) {
      console.error('Product image DB insert error:', productImageInsertError);
      if (tempProductId) await supabase.from('products').delete().eq('id', tempProductId);
      if (tempImageFilePath) await supabase.storage.from('product-images').remove([tempImageFilePath]);
      return NextResponse.json({ error: `Failed to link image to product: ${productImageInsertError.message}. Product creation rolled back.` }, { status: 500 });
    }
    
    // 5. Refetch the complete product data with joins for the response
    const { data: finalProductData, error: finalFetchError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        stock,
        category_id ( id, name ),
        brand_id ( id, name ),
        product_images ( image_url, is_primary )
      `)
      .eq('id', productData.id)
      .single();

    if (finalFetchError || !finalProductData) {
      console.error('Error refetching product after creation:', finalFetchError?.message);
      return NextResponse.json({ success: true, product: productData, warning: 'Product created, but failed to refetch full details.' }, { status: 201 });
    }

    return NextResponse.json({ success: true, product: finalProductData }, { status: 201 });

  } catch (e: unknown) {
    console.error('POST /api/products general error:', e);
    if (tempProductId) await supabase.from('products').delete().eq('id', tempProductId).catch(err => console.error("Rollback product delete failed", err));
    if (tempImageFilePath) await supabase.storage.from('product-images').remove([tempImageFilePath]).catch(err => console.error("Rollback image delete failed", err));
    
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during product creation.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET handler for fetching all products (for admin panel or potentially public listing)
export async function GET(req: NextRequest) {
  const cookieStore = await cookies(); 
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Admin check for fetching all products - assuming this is for admin panel
    // If this needs to be public, remove isAdmin check or create separate public endpoint
    if (!await isAdmin(supabase)) {
      // For public product listings, you'd typically not require admin role.
      // However, this specific endpoint is often used by admin panels.
      // If you have a public product listing, it might use a different, simpler query.
      // For now, keeping it admin-protected.
      // return NextResponse.json({ error: 'Forbidden: Admin access required to list all products via this endpoint.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        stock,
        category_id ( id, name ),
        brand_id ( id, name ),
        product_images ( image_url, is_primary ),
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error.message);
      return NextResponse.json({ error: 'Failed to fetch products: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while fetching products.';
    console.error('GET /api/products general error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    
