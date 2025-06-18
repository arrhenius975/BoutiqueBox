
// src/app/api/products/[id]/route.ts
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies(); 
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (!await isAdmin(supabase)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }
  try {
    const { id: productId } = params;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required for deletion.' }, { status: 400 });
    }

    const { data: existingProduct, error: fetchExistingError } = await supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .single();

    if (fetchExistingError || !existingProduct) {
        if (fetchExistingError && fetchExistingError.code === 'PGRST116') { 
             return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
        }
        console.error(`Error checking if product ${productId} exists:`, fetchExistingError?.message);
        return NextResponse.json({ error: `Failed to verify product existence: ${fetchExistingError?.message}` }, { status: 500 });
    }

    const { data: imagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId);

    if (imagesError) {
      console.warn(`Error fetching image URLs for product ${productId}:`, imagesError.message);
    }

    // Product deletion will cascade to product_images if ON DELETE CASCADE is set.
    // If not, product_images entries must be deleted first or this will fail if images exist.
    // Assuming ON DELETE CASCADE for product_images.product_id FK to products.id.
    // If cascade is not set, you'd delete product_images first:
    // const { error: imageRecordsDeleteError } = await supabase.from('product_images').delete().eq('product_id', productId);
    // if (imageRecordsDeleteError) { /* handle error */ }


    const { error: productDeleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (productDeleteError) {
      console.error(`Error deleting product ${productId} from database:`, productDeleteError.message);
      if (productDeleteError.code === '23503') { 
        return NextResponse.json({ error: 'Cannot delete product: It is currently referenced by other records (e.g., in orders or wishlists). Please remove those references first.' }, { status: 409 });
      }
      return NextResponse.json({ error: `Failed to delete product: ${productDeleteError.message}` }, { status: 500 });
    }

    // If product deletion was successful, attempt to clean up images from storage.
    // This is separate from deleting the DB records in `product_images`.
    if (imagesData && imagesData.length > 0) {
      const imagePathsToDelete: string[] = [];
      for (const img of imagesData) {
        if (img.image_url && !img.image_url.startsWith('https://placehold.co')) {
          try {
            const url = new URL(img.image_url);
            const pathSegments = url.pathname.split('/');
            // Assuming bucket name is 'product-images' and path is like /object/public/product-images/<product_id>/<filename>
            // We need the path inside the bucket: <product_id>/<filename>
            const bucketNameIndex = pathSegments.indexOf('product-images');
            if (bucketNameIndex !== -1 && bucketNameIndex < pathSegments.length -1 ) {
              imagePathsToDelete.push(pathSegments.slice(bucketNameIndex + 1).join('/'));
            } else {
               console.warn(`Could not parse path from image URL for deletion: ${img.image_url}`);
            }
          } catch (e) {
            console.warn(`Invalid image URL found during delete operation for product ${productId}: ${img.image_url}`, e);
          }
        }
      }

      if (imagePathsToDelete.length > 0) {
        const { error: storageDeleteError } = await supabase.storage
          .from('product-images')
          .remove(imagePathsToDelete);

        if (storageDeleteError) {
          console.warn(`Error deleting images from storage for product ${productId}:`, storageDeleteError.message);
          return NextResponse.json({
            success: true, 
            message: `Product deleted from database, but failed to cleanup some images from storage: ${storageDeleteError.message}. Please check storage and RLS policies.`
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Product and associated images/records deleted successfully.' });

  } catch (e: unknown) {
    console.error(`DELETE /api/products/[id] general error:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during product deletion.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies(); 
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (!await isAdmin(supabase)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }
  try {
    const { id: productId } = params;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required for update.' }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const category_id_str = formData.get('category_id') as string;
    const brand_id_str = formData.get('brand_id') as string | null;
    const imageFile = formData.get('imageFile') as File | null;
    const stockStr = formData.get('stock') as string | null; 
    // data_ai_hint is not processed for DB operations

    if (!name || !priceStr || !category_id_str || !stockStr) { 
      return NextResponse.json({ error: 'Missing required fields: name, price, stock, category_id.' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    const category_id = parseInt(category_id_str, 10);
    const stock = parseInt(stockStr, 10); 
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
    if (imageFile && imageFile.size > 2 * 1024 * 1024) { // 2MB limit
        return NextResponse.json({ error: 'Image file too large (max 2MB).' }, { status: 413 });
    }


    const productUpdatePayload: {
      name: string;
      description?: string;
      price: number;
      stock?: number;
      category_id: number;
      brand_id?: number | null;
      updated_at: string;
    } = {
      name: name.trim(),
      description: description?.trim() || undefined,
      price,
      stock, 
      category_id,
      brand_id: brand_id,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProductData, error: productUpdateError } = await supabase
      .from('products')
      .update(productUpdatePayload)
      .eq('id', productId)
      .select('id') // Select only ID to confirm update, will refetch full data later
      .single();

    if (productUpdateError || !updatedProductData) {
      console.error('Product update error:', productUpdateError?.message);
      if (productUpdateError?.code === '23505') {
        return NextResponse.json({ error: `Product update failed: A product with similar unique details might already exist. ${productUpdateError.details || productUpdateError.message}` }, { status: 409 });
      }
      if (productUpdateError?.code === '23503') {
         return NextResponse.json({ error: `Product update failed: Invalid category or brand specified. ${productUpdateError.details || productUpdateError.message}` }, { status: 400 });
      }
       if (productUpdateError?.code === 'PGRST116') { 
        return NextResponse.json({ error: 'Product not found for update.' }, { status: 404 });
      }
      return NextResponse.json({ error: productUpdateError?.message || 'Product update failed. Please check data and try again.' }, { status: 500 });
    }

    if (imageFile && imageFile.size > 0) {
      const { data: oldImages, error: oldImagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (oldImagesError) {
        console.warn(`Could not fetch old image URLs for product ${productId} during update. Error: ${oldImagesError.message}`);
      } else if (oldImages && oldImages.length > 0) {
        const oldImageStoragePaths = oldImages.map(img => {
          if (img.image_url && !img.image_url.startsWith('https://placehold.co')) {
            try {
              const url = new URL(img.image_url);
              const pathSegments = url.pathname.split('/');
              const bucketNameIndex = pathSegments.indexOf('product-images');
              if (bucketNameIndex !== -1 && bucketNameIndex < pathSegments.length -1 ) {
                 return pathSegments.slice(bucketNameIndex + 1).join('/');
              }
            } catch (e) { console.warn(`Invalid old image URL format: ${img.image_url}`); }
          }
          return null;
        }).filter(path => path !== null) as string[];

        if (oldImageStoragePaths.length > 0) {
          const { error: removeStorageError } = await supabase.storage.from('product-images').remove(oldImageStoragePaths);
          if (removeStorageError) console.warn(`Failed to remove old images from storage for ${productId}: ${removeStorageError.message}`);
        }

        const { error: deleteDbImagesError } = await supabase.from('product_images').delete().eq('product_id', productId);
        if (deleteDbImagesError) console.warn(`Failed to delete old image records from DB for ${productId}: ${deleteDbImagesError.message}`);
      }

      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const newFilePath = `${productId}/${Date.now()}-${sanitizedFileName}`; 
      
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(newFilePath, imageFile, { upsert: true, contentType: imageFile.type }); 

      if (uploadErr) {
        console.error('New image upload error during update:', uploadErr);
        // Product details were updated, but image failed.
      } else {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(newFilePath);
        if (!urlData || !urlData.publicUrl) {
          console.error('Failed to get public URL for new uploaded image:', newFilePath);
        } else {
          const { error: newProductImageInsertError } = await supabase.from('product_images').insert({
            product_id: productId,
            image_url: urlData.publicUrl,
            is_primary: true,
          });
          if (newProductImageInsertError) {
            console.error('New product image DB insert error:', newProductImageInsertError);
          }
        }
      }
    }

    // Refetch the product with all joined data for the final response
    const { data: finalProductData, error: finalProductFetchError } = await supabase
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
      .eq('id', productId)
      .single();

    if (finalProductFetchError || !finalProductData) {
        console.error('Failed to refetch product after update/image handling:', finalProductFetchError);
        return NextResponse.json({ 
            success: true, 
            product: { id: productId, ...productUpdatePayload }, // return what we updated if refetch fails
            warning: 'Product updated, but failed to retrieve final details for response.'
        }, {status: 200});
    }

    return NextResponse.json({ success: true, product: finalProductData });

  } catch (e: unknown) {
    console.error(`PUT /api/products/[id] general error:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during product update.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    
    
