
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const stockStr = formData.get('stock') as string | null; // Stock might not always be provided
    const category_id_str = formData.get('category_id') as string;
    const brand_id_str = formData.get('brand_id') as string | null; // Brand ID might be optional
    const dataAiHint = formData.get('dataAiHint') as string | null;

    const imageFile = formData.get('imageFile') as File | null;

    // Validate required fields
    if (!name || !priceStr || !category_id_str) {
        return NextResponse.json({ error: 'Missing required fields: name, price, category_id' }, { status: 400 });
    }
     // Image file is required for new product if provided
    if (imageFile && imageFile.size === 0) {
        return NextResponse.json({ error: 'Image file cannot be empty if provided.' }, { status: 400 });
    }


    const price = parseFloat(priceStr);
    // Default stock to 0 if not provided or invalid, but ensure it's a number
    const stock = stockStr ? parseInt(stockStr, 10) : 0; 
    const category_id = parseInt(category_id_str, 10);
    // brand_id can be null if not provided or if the string is 'null' or empty
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '') ? parseInt(brand_id_str, 10) : null;

    if (isNaN(price) || isNaN(stock) || isNaN(category_id)) {
        return NextResponse.json({ error: 'Invalid numeric value for price, stock, or category_id' }, { status: 400 });
    }
    if (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && isNaN(brand_id as number)) {
        return NextResponse.json({ error: 'Invalid numeric value for brand_id' }, { status: 400 });
    }


    // 1. Create product in 'products' table
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

    let publicUrl = `https://placehold.co/400x300.png?text=${name.substring(0,2)}`; // Default placeholder

    if (imageFile && imageFile.size > 0) {
        const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filePath = `product-images/${productData.id}/${Date.now()}-${sanitizedFileName}`;

        const { error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(filePath, imageFile, { upsert: true, contentType: imageFile.type });

        if (uploadErr) {
            console.error('Image upload error:', uploadErr);
            // Product created, but image upload failed. Consider if product should be deleted or if this is acceptable.
            // For now, return an error indicating partial failure.
            return NextResponse.json({ error: `Product created, but image upload failed: ${uploadErr.message}. Product ID: ${productData.id}` }, { status: 500 });
        }

        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
        
        if (!urlData || !urlData.publicUrl) {
            console.error('Failed to get public URL for uploaded image:', filePath);
            return NextResponse.json({ error: `Product created, image uploaded, but failed to retrieve public URL. Product ID: ${productData.id}` }, { status: 500 });
        }
        publicUrl = urlData.publicUrl;

        // 3. Save image URL to 'product_images' table
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
        // If no image file was provided, still insert a placeholder into product_images for consistency
         const { error: placeholderImageInsertError } = await supabase.from('product_images').insert({
            product_id: productData.id,
            image_url: publicUrl, 
            is_primary: true
        });
         if (placeholderImageInsertError) {
            console.warn('Failed to insert placeholder image URL for product:', productData.id, placeholderImageInsertError);
            // This is not a critical failure, so we can proceed.
        }
    }

    // Return the created product data, potentially including the image URL for client-side update
    return NextResponse.json({ success: true, product: { ...productData, image: publicUrl, category: { name: category_id_str } /* simple mock for immediate UI update */ } });
  } catch (e: unknown) {
    console.error('POST /api/products unexpected error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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
        data_ai_hint
      `)
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

    