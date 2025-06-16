
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
    if (imageFile && imageFile.size === 0) { // Check if an image file was provided but is empty
        return NextResponse.json({ error: 'Image file cannot be empty if provided.' }, { status: 400 });
    }
    if (!imageFile && !formData.has('currentImageUrl')) { // Check if no new image and no existing one (for POST, imageFile is generally expected)
      // For POST, we usually expect an image. If currentImageUrl logic were here, it'd be for PUT.
      // So, if no imageFile, it's typically an error for a new product unless placeholders are auto-generated
      // and image is truly optional, which is not the case here as per ProductForm logic.
       return NextResponse.json({ error: 'Product image is required for new products.' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    const stock = parseInt(stockStr, 10);
    const category_id = parseInt(category_id_str, 10);
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '') ? parseInt(brand_id_str, 10) : null;

    if (isNaN(price) || isNaN(stock) || isNaN(category_id)) {
        return NextResponse.json({ error: 'Invalid numeric value for price, stock, or category_id' }, { status: 400 });
    }
    if (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && isNaN(brand_id as number)) {
        return NextResponse.json({ error: 'Invalid numeric value for brand_id' }, { status: 400 });
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
        name,
        description: description || undefined,
        price,
        stock,
        category_id,
        brand_id: brand_id,
        data_ai_hint: dataAiHint || name.toLowerCase().split(" ")[0] || "product"
    };

    const { data: productData, error: productInsertError } = await supabase
      .from('products')
      .insert([productInsertPayload])
      .select()
      .single();

    if (productInsertError || !productData) {
      console.error('Product insert error:', productInsertError);
      return NextResponse.json({ error: productInsertError?.message || 'Product insertion failed' }, { status: 500 });
    }

    let publicUrl = `https://placehold.co/400x300.png?text=${encodeURIComponent(name.substring(0,2))}`; 

    if (imageFile && imageFile.size > 0) {
        const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        // Corrected filePath for Supabase Storage: bucket_name/product_id/file_name
        const filePath = `${productData.id}/${Date.now()}-${sanitizedFileName}`; // Path relative to the bucket

        const { error: uploadErr } = await supabase.storage
            .from('product-images') // Bucket name
            .upload(filePath, imageFile, { upsert: true, contentType: imageFile.type });

        if (uploadErr) {
            console.error('Image upload error:', uploadErr);
            return NextResponse.json({ error: `Product created, but image upload failed: ${uploadErr.message}. Product ID: ${productData.id}` }, { status: 500 });
        }

        const { data: urlData } = supabase.storage
            .from('product-images') // Bucket name
            .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
            console.error('Failed to get public URL for uploaded image:', filePath);
            return NextResponse.json({ error: `Product created, image uploaded, but failed to retrieve public URL. Product ID: ${productData.id}` }, { status: 500 });
        }
        publicUrl = urlData.publicUrl;

        const { error: productImageInsertError } = await supabase.from('product_images').insert({
            product_id: productData.id,
            image_url: publicUrl,
            is_primary: true
        });

        if (productImageInsertError) {
            console.error('Product image DB insert error:', productImageInsertError);
            return NextResponse.json({ error: `Product created, image uploaded, but linking image to product failed: ${productImageInsertError.message}. Product ID: ${productData.id}` }, { status: 500 });
        }
    } else {
        // If no imageFile, link the default placeholder image
         const { error: placeholderImageInsertError } = await supabase.from('product_images').insert({
            product_id: productData.id,
            image_url: publicUrl, // This is the placeholder URL
            is_primary: true
        });
         if (placeholderImageInsertError) {
            console.warn('Failed to insert placeholder image URL for product:', productData.id, placeholderImageInsertError);
            // Not returning error here as product creation was successful, but image linking might need attention.
        }
    }
    
    // Refetch the product with its category name for the response
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
        // Return the initially created productData if refetch fails, but log the issue.
        return NextResponse.json({ success: true, product: { ...productData, image: publicUrl, category: { name: 'Category name fetch pending'} } });
    }


    return NextResponse.json({ success: true, product: finalProductData });
  } catch (e: unknown) {
    console.error('POST /api/products unexpected error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (e: unknown) {
    console.error('GET /api/products general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
