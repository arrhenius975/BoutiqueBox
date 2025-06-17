
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
    const brand_id_str = formData.get('brand_id') as string | null; // Can be null or not present
    const dataAiHint = formData.get('data_ai_hint') as string | null;
    const imageFile = formData.get('imageFile') as File | null;
    const stockStr = formData.get('stock') as string | null;

    if (!name || !priceStr || !category_id_str || !stockStr) {
      return NextResponse.json({ error: 'Missing required fields: name, price, stock, category_id.' }, { status: 400 });
    }
    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: 'Product image is required for new products.' }, { status: 400 });
    }
    if (imageFile.size > 2 * 1024 * 1024) { // 2MB limit
        return NextResponse.json({ error: 'Image file too large (max 2MB).' }, { status: 413 }); // 413 Payload Too Large
    }

    const price = parseFloat(priceStr);
    const category_id = parseInt(category_id_str, 10);
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '') ? parseInt(brand_id_str, 10) : null;
    const stock = parseInt(stockStr, 10);

    if (isNaN(price) || price <= 0) {
        return NextResponse.json({ error: 'Invalid price value. Must be a number greater than 0.' }, { status: 400 });
    }
    if (isNaN(stock) || stock < 0) { // Stock can be 0
        return NextResponse.json({ error: 'Invalid stock value. Must be a non-negative number.' }, { status: 400 });
    }
    if (isNaN(category_id)) {
        return NextResponse.json({ error: 'Invalid category_id. Must be a number.' }, { status: 400 });
    }
    if (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && isNaN(brand_id as number)) {
        return NextResponse.json({ error: 'Invalid numeric value for brand_id.' }, { status: 400 });
    }


    // 1. Insert product details into 'products' table
    const productInsertPayload = {
      name: name.trim(),
      description: description?.trim() || undefined,
      price,
      stock,
      category_id,
      brand_id: brand_id, // Will be null if brand_id_str was null/empty
      data_ai_hint: dataAiHint?.trim() || name.trim().toLowerCase().split(" ")[0] || "product",
    };

    const { data: productData, error: productInsertError } = await supabase
      .from('products')
      .insert(productInsertPayload)
      .select()
      .single();

    if (productInsertError || !productData) {
      console.error('Product insert error:', productInsertError?.message);
      if (productInsertError?.code === '23505') { // Unique constraint violation (e.g. if name was unique)
        return NextResponse.json({ error: `Product creation failed: A product with similar unique details might already exist. ${productInsertError.details || productInsertError.message}` }, { status: 409 });
      }
      if (productInsertError?.code === '23503') { // Foreign key violation (e.g. category_id or brand_id doesn't exist)
         return NextResponse.json({ error: `Product creation failed: Invalid category or brand specified. ${productInsertError.details || productInsertError.message}` }, { status: 400 });
      }
      return NextResponse.json({ error: productInsertError?.message || 'Product creation failed. Please check data and try again.' }, { status: 500 });
    }
    tempProductId = productData.id; // Store for potential rollback

    // 2. Upload image to Supabase Storage
    const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = `${productData.id}/${Date.now()}-${sanitizedFileName}`;
    tempImageFilePath = filePath; // Store for potential rollback

    const { error: uploadError } = await supabase.storage
      .from('product-images') // Ensure this bucket exists and has RLS for admin uploads
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false, // Don't upsert for new product image, should be unique path
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      // Attempt to delete the product record if image upload fails
      if (tempProductId) {
        await supabase.from('products').delete().eq('id', tempProductId);
      }
      return NextResponse.json({ error: `Image upload failed: ${uploadError.message}. Product not created.` }, { status: 500 });
    }

    // 3. Get public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('Failed to get public URL for image:', filePath);
      // Attempt to delete product record and uploaded image
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
        is_primary: true, // Assuming the first uploaded image is primary
      });

    if (productImageInsertError) {
      console.error('Product image DB insert error:', productImageInsertError);
      // Attempt to roll back: delete product record and uploaded image
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
        product_images ( image_url, is_primary ),
        data_ai_hint
      `)
      .eq('id', productData.id)
      .single();

    if (finalFetchError || !finalProductData) {
      console.error('Error refetching product after creation:', finalFetchError?.message);
      // Product was created, but we can't return the full details.
      // Return the basic productData as a fallback.
      return NextResponse.json({ success: true, product: productData, warning: 'Product created, but failed to refetch full details.' }, { status: 201 });
    }

    return NextResponse.json({ success: true, product: finalProductData }, { status: 201 });

  } catch (e: unknown) {
    console.error('POST /api/products general error:', e);
    // Attempt to roll back if we have IDs
    if (tempProductId) await supabase.from('products').delete().eq('id', tempProductId).catch(err => console.error("Rollback product delete failed", err));
    if (tempImageFilePath) await supabase.storage.from('product-images').remove([tempImageFilePath]).catch(err => console.error("Rollback image delete failed", err));
    
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during product creation.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET handler for fetching all products (for admin panel or potentially public listing)
export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Public GET for all products should not require admin typically,
  // but if used only by admin panel, this check can be added.
  // For now, assume public access for listing products.
  // if (!await isAdmin(supabase)) {
  //   return NextResponse.json({ error: 'Forbidden: Admin access required for this view of products.' }, { status: 403 });
  // }
  
  try {
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
        data_ai_hint,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error.message);
      return NextResponse.json({ error: 'Failed to fetch products: ' + error.message }, { status: 500 });
    }

    // No transformation needed here if the query directly gives the desired structure
    return NextResponse.json(data);

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while fetching products.';
    console.error('GET /api/products general error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
