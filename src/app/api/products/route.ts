
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
  console.log("API /api/products: POST request received.");

  if (!await isAdmin(supabase)) {
    console.warn("API /api/products: Admin check failed. Forbidden access.");
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }
  console.log("API /api/products: Admin authenticated.");

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

    console.log("API /api/products: Received FormData fields:", {
        name, description, priceStr, category_id_str, brand_id_str, imageFileName: imageFile?.name, imageFileSize: imageFile?.size, stockStr
    });

    if (!name || !priceStr || !category_id_str || !stockStr) {
      console.warn("API /api/products: Validation failed - Missing required fields.");
      return NextResponse.json({ error: 'Missing required fields: name, price, stock, category_id.' }, { status: 400 });
    }
    if (!imageFile || imageFile.size === 0) {
      console.warn("API /api/products: Validation failed - Product image is required.");
      return NextResponse.json({ error: 'Product image is required for new products.' }, { status: 400 });
    }
    if (imageFile.size > 2 * 1024 * 1024) { // 2MB limit
      console.warn("API /api/products: Validation failed - Image file too large.");
      return NextResponse.json({ error: 'Image file too large (max 2MB).' }, { status: 413 });
    }

    const price = parseFloat(priceStr);
    const category_id = parseInt(category_id_str, 10);
    const stock = parseInt(stockStr, 10);
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && !isNaN(parseInt(brand_id_str, 10))) 
                     ? parseInt(brand_id_str, 10) 
                     : null;

    if (isNaN(price) || price <= 0) {
      console.warn("API /api/products: Validation failed - Invalid price value.");
      return NextResponse.json({ error: 'Invalid price value. Must be a number greater than 0.' }, { status: 400 });
    }
    if (isNaN(stock) || stock < 0) {
      console.warn("API /api/products: Validation failed - Invalid stock value.");
      return NextResponse.json({ error: 'Invalid stock value. Must be a non-negative number.' }, { status: 400 });
    }
    if (isNaN(category_id)) {
      console.warn("API /api/products: Validation failed - Invalid category_id.");
      return NextResponse.json({ error: 'Invalid category_id. Must be a number.' }, { status: 400 });
    }

    const productInsertPayload = {
      name: name.trim(),
      description: description?.trim() || undefined,
      price,
      stock,
      category_id,
      brand_id: brand_id,
    };
    console.log("API /api/products: Attempting to insert product with payload:", productInsertPayload);

    const { data: productData, error: productInsertError } = await supabase
      .from('products')
      .insert(productInsertPayload)
      .select()
      .single();

    if (productInsertError || !productData) {
      console.error('API /api/products: Supabase product insert error:', productInsertError);
      if (productInsertError?.code === '23505') { 
        return NextResponse.json({ error: `Product creation failed: A product with similar unique details might already exist. ${productInsertError.details || productInsertError.message}` }, { status: 409 });
      }
      if (productInsertError?.code === '23503') { 
         return NextResponse.json({ error: `Product creation failed: Invalid category or brand specified. ${productInsertError.details || productInsertError.message}` }, { status: 400 });
      }
      return NextResponse.json({ error: productInsertError?.message || 'Product creation failed. Please check data and try again.' }, { status: 500 });
    }
    tempProductId = productData.id; 
    console.log("API /api/products: Product inserted successfully, ID:", tempProductId);

    const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = `${productData.id}/${Date.now()}-${sanitizedFileName}`;
    tempImageFilePath = filePath; 
    console.log("API /api/products: Attempting to upload image to Supabase Storage at path:", filePath);

    const { error: uploadError } = await supabase.storage
      .from('product-images') 
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false, 
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error('API /api/products: Supabase Storage upload error:', uploadError);
      if (tempProductId) {
        console.log("API /api/products: Rolling back product insert due to image upload failure, deleting product ID:", tempProductId);
        await supabase.from('products').delete().eq('id', tempProductId);
      }
      return NextResponse.json({ error: `Image upload failed: ${uploadError.message}. Product not created.` }, { status: 500 });
    }
    console.log("API /api/products: Image uploaded successfully to path:", filePath);

    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('API /api/products: Failed to get public URL for image:', filePath);
      if (tempProductId) {
        console.log("API /api/products: Rolling back product insert due to public URL failure, deleting product ID:", tempProductId);
        await supabase.from('products').delete().eq('id', tempProductId);
      }
      if (tempImageFilePath) {
        console.log("API /api/products: Rolling back image upload due to public URL failure, deleting image path:", tempImageFilePath);
        await supabase.storage.from('product-images').remove([tempImageFilePath]);
      }
      return NextResponse.json({ error: 'Image uploaded, but failed to get public URL. Product creation rolled back.' }, { status: 500 });
    }
    const imageUrl = publicUrlData.publicUrl;
    console.log("API /api/products: Public URL for image obtained:", imageUrl);

    console.log("API /api/products: Attempting to insert image metadata into 'product_images' table for product ID:", productData.id);
    const { error: productImageInsertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productData.id,
        image_url: imageUrl,
        is_primary: true, 
      });

    if (productImageInsertError) {
      console.error('API /api/products: Supabase product_images insert error:', productImageInsertError);
      if (tempProductId) {
        console.log("API /api/products: Rolling back product insert due to image metadata failure, deleting product ID:", tempProductId);
        await supabase.from('products').delete().eq('id', tempProductId);
      }
      if (tempImageFilePath) {
        console.log("API /api/products: Rolling back image upload due to image metadata failure, deleting image path:", tempImageFilePath);
        await supabase.storage.from('product-images').remove([tempImageFilePath]);
      }
      return NextResponse.json({ error: `Failed to link image to product: ${productImageInsertError.message}. Product creation rolled back.` }, { status: 500 });
    }
    console.log("API /api/products: Image metadata inserted successfully.");
    
    console.log("API /api/products: Attempting to refetch product with joined data for ID:", productData.id);
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
      console.error('API /api/products: Error refetching product after creation:', finalFetchError);
      return NextResponse.json({ success: true, product: productData, warning: 'Product created, but failed to refetch full details.' }, { status: 201 });
    }
    console.log("API /api/products: Product refetched successfully. Creation process complete.");
    return NextResponse.json({ success: true, product: finalProductData }, { status: 201 });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during product creation.';
    console.error('API /api/products: General error in POST handler:', errorMessage, e);
    
    if (tempProductId) {
      console.log("API /api/products: General error rollback - attempting to delete product ID:", tempProductId);
      await supabase.from('products').delete().eq('id', tempProductId).catch(err => console.error("API /api/products: Rollback product delete failed", err));
    }
    if (tempImageFilePath) {
      console.log("API /api/products: General error rollback - attempting to delete image path:", tempImageFilePath);
      await supabase.storage.from('product-images').remove([tempImageFilePath]).catch(err => console.error("API /api/products: Rollback image delete failed", err));
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET handler for fetching all products (for admin panel or potentially public listing)
export async function GET(req: NextRequest) {
  const cookieStore = await cookies(); 
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  console.log("API /api/products: GET request received.");
  
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
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API /api/products: Error fetching products in Supabase:', error.message);
      return NextResponse.json({ error: 'Failed to fetch products: ' + error.message }, { status: 500 });
    }
    console.log(`API /api/products: Fetched ${data?.length || 0} products successfully.`);
    return NextResponse.json(data);

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while fetching products.';
    console.error('API /api/products: General error in GET handler:', errorMessage, e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    
    
