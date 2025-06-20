
// src/app/api/products/[id]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// Using Request from Web API standard

interface ProductRouteParams {
  id: string;
}

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
  request: Request, 
  { params }: { params: ProductRouteParams }
) {
  const cookieStore = await cookies(); 
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  console.log(`API /api/products/[id]: DELETE request received for ID: ${params.id}`);

  if (!await isAdmin(supabase)) {
    console.warn(`API /api/products/[id]: Admin check failed for DELETE ID: ${params.id}. Forbidden access.`);
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }
  console.log(`API /api/products/[id]: Admin authenticated for DELETE ID: ${params.id}.`);

  try {
    const { id: productId } = params;

    if (!productId) {
      console.warn('API /api/products/[id]: Product ID missing in DELETE request.');
      return NextResponse.json({ error: 'Product ID is required for deletion.' }, { status: 400 });
    }
    console.log(`API /api/products/[id]: Attempting to delete product with ID: ${productId}`);

    console.log(`API /api/products/[id]: Checking if product ${productId} exists before deletion.`);
    const { data: existingProduct, error: fetchExistingError } = await supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .single();

    if (fetchExistingError || !existingProduct) {
        if (fetchExistingError && fetchExistingError.code === 'PGRST116') { 
             console.warn(`API /api/products/[id]: Product ${productId} not found for deletion.`);
             return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
        }
        console.error(`API /api/products/[id]: Error checking if product ${productId} exists:`, fetchExistingError?.message);
        return NextResponse.json({ error: `Failed to verify product existence: ${fetchExistingError?.message}` }, { status: 500 });
    }
    console.log(`API /api/products/[id]: Product ${productId} confirmed to exist. Proceeding with image and product record deletion.`);

    console.log(`API /api/products/[id]: Fetching image URLs for product ${productId}.`);
    const { data: imagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId);

    if (imagesError) {
      console.warn(`API /api/products/[id]: Error fetching image URLs for product ${productId}:`, imagesError.message, "Proceeding with product deletion anyway.");
    } else {
      console.log(`API /api/products/[id]: Found ${imagesData?.length || 0} images associated with product ${productId}.`);
    }

    console.log(`API /api/products/[id]: Deleting product record for ${productId} from 'products' table.`);
    const { error: productDeleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (productDeleteError) {
      console.error(`API /api/products/[id]: Error deleting product ${productId} from database:`, productDeleteError.message);
      if (productDeleteError.code === '23503') { 
        return NextResponse.json({ error: 'Cannot delete product: It is currently referenced by other records (e.g., in orders or wishlists). Please remove those references first.' }, { status: 409 });
      }
      return NextResponse.json({ error: `Failed to delete product: ${productDeleteError.message}` }, { status: 500 });
    }
    console.log(`API /api/products/[id]: Product record for ${productId} deleted successfully.`);

    if (imagesData && imagesData.length > 0) {
      const imagePathsToDelete: string[] = [];
      console.log(`API /api/products/[id]: Parsing image paths for deletion from storage for product ${productId}.`);
      for (const img of imagesData) {
        if (img.image_url && !img.image_url.startsWith('https://placehold.co')) {
          try {
            const url = new URL(img.image_url);
            const pathSegments = url.pathname.split('/');
            const bucketNameIndex = pathSegments.indexOf('product-images');
            if (bucketNameIndex !== -1 && bucketNameIndex < pathSegments.length -1 ) {
              const storagePath = pathSegments.slice(bucketNameIndex + 1).join('/');
              imagePathsToDelete.push(storagePath);
              console.log(`API /api/products/[id]: Added path to delete from storage: ${storagePath}`);
            } else {
               console.warn(`API /api/products/[id]: Could not parse path from image URL for deletion: ${img.image_url}`);
            }
          } catch (e) {
            console.warn(`API /api/products/[id]: Invalid image URL found during delete operation for product ${productId}: ${img.image_url}`, e);
          }
        }
      }

      if (imagePathsToDelete.length > 0) {
        console.log(`API /api/products/[id]: Attempting to delete ${imagePathsToDelete.length} images from Supabase Storage bucket 'product-images'. Paths:`, imagePathsToDelete.join(', '));
        const { error: storageDeleteError } = await supabase.storage
          .from('product-images')
          .remove(imagePathsToDelete);

        if (storageDeleteError) {
          console.warn(`API /api/products/[id]: Error deleting images from storage for product ${productId}:`, storageDeleteError.message);
          return NextResponse.json({
            success: true, 
            message: `Product deleted from database, but failed to cleanup some images from storage: ${storageDeleteError.message}. Please check storage and RLS policies.`
          });
        }
        console.log(`API /api/products/[id]: Successfully deleted images from storage for product ${productId}.`);
      } else {
        console.log(`API /api/products/[id]: No images found in storage to delete for product ${productId} (or all were placeholders).`);
      }
    }

    console.log(`API /api/products/[id]: Product ${productId} and associated images/records deleted successfully.`);
    return NextResponse.json({ success: true, message: 'Product and associated images/records deleted successfully.' });

  } catch (e: unknown) {
    console.error(`API /api/products/[id]: General error in DELETE handler for ID: ${params.id}:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during product deletion.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: Request, 
  { params }: { params: ProductRouteParams }
) {
  const cookieStore = await cookies(); 
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  console.log(`API /api/products/[id]: PUT request received for ID: ${params.id}`);

  if (!await isAdmin(supabase)) {
    console.warn(`API /api/products/[id]: Admin check failed for PUT ID: ${params.id}. Forbidden access.`);
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }
  console.log(`API /api/products/[id]: Admin authenticated for PUT ID: ${params.id}.`);

  try {
    const { id: productId } = params;
    if (!productId) {
      console.warn('API /api/products/[id]: Product ID missing in PUT request.');
      return NextResponse.json({ error: 'Product ID is required for update.' }, { status: 400 });
    }
    console.log(`API /api/products/[id]: Attempting to update product with ID: ${productId}`);

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const category_id_str = formData.get('category_id') as string;
    const brand_id_str = formData.get('brand_id') as string | null;
    const imageFile = formData.get('imageFile') as File | null;
    const stockStr = formData.get('stock') as string | null; 

    console.log(`API /api/products/[id]: PUT FormData for product ${productId}:`, {
        name, description, priceStr, category_id_str, brand_id_str, imageFileName: imageFile?.name, imageFileSize: imageFile?.size, stockStr
    });

    if (!name || !priceStr || !category_id_str || !stockStr) { 
      console.warn(`API /api/products/[id]: Validation failed for product ${productId} - Missing required fields.`);
      return NextResponse.json({ error: 'Missing required fields: name, price, stock, category_id.' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    const category_id = parseInt(category_id_str, 10);
    const stock = parseInt(stockStr, 10); 
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && !isNaN(parseInt(brand_id_str, 10))) 
                     ? parseInt(brand_id_str, 10) 
                     : null;

    if (isNaN(price) || price <= 0) {
        console.warn(`API /api/products/[id]: Validation failed for product ${productId} - Invalid price.`);
        return NextResponse.json({ error: 'Invalid price value. Must be a number greater than 0.' }, { status: 400 });
    }
    if (isNaN(stock) || stock < 0) {
        console.warn(`API /api/products/[id]: Validation failed for product ${productId} - Invalid stock.`);
        return NextResponse.json({ error: 'Invalid stock value. Must be a non-negative number.' }, { status: 400 });
    }
    if (isNaN(category_id)) {
        console.warn(`API /api/products/[id]: Validation failed for product ${productId} - Invalid category_id.`);
        return NextResponse.json({ error: 'Invalid category_id. Must be a number.' }, { status: 400 });
    }
    if (imageFile && imageFile.size > 2 * 1024 * 1024) { 
        console.warn(`API /api/products/[id]: Validation failed for product ${productId} - Image too large.`);
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
    console.log(`API /api/products/[id]: Product update payload for ${productId}:`, productUpdatePayload);

    const { data: updatedProductData, error: productUpdateError } = await supabase
      .from('products')
      .update(productUpdatePayload)
      .eq('id', productId)
      .select('id') 
      .single();

    if (productUpdateError || !updatedProductData) {
      console.error(`API /api/products/[id]: Product update error for ${productId}:`, productUpdateError?.message);
      if (productUpdateError?.code === '23505') {
        return NextResponse.json({ error: `Product update failed: A product with similar unique details might already exist. ${productUpdateError.details || productUpdateError.message}` }, { status: 409 });
      }
      if (productUpdateError?.code === '23503') {
         return NextResponse.json({ error: `Product update failed: Invalid category or brand specified. ${productUpdateError.details || productUpdateError.message}` }, { status: 400 });
      }
       if (productUpdateError?.code === 'PGRST116') { 
        console.warn(`API /api/products/[id]: Product ${productId} not found for update.`);
        return NextResponse.json({ error: 'Product not found for update.' }, { status: 404 });
      }
      return NextResponse.json({ error: productUpdateError?.message || 'Product update failed. Please check data and try again.' }, { status: 500 });
    }
    console.log(`API /api/products/[id]: Product ${productId} metadata updated successfully.`);

    if (imageFile && imageFile.size > 0) {
      console.log(`API /api/products/[id]: New image file provided for product ${productId}. Processing image update.`);
      console.log(`API /api/products/[id]: Fetching old image URLs for product ${productId} to delete them.`);
      const { data: oldImages, error: oldImagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (oldImagesError) {
        console.warn(`API /api/products/[id]: Could not fetch old image URLs for product ${productId} during update. Error: ${oldImagesError.message}. Proceeding with new image upload.`);
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
            } catch (e) { console.warn(`API /api/products/[id]: Invalid old image URL format: ${img.image_url}`); }
          }
          return null;
        }).filter(path => path !== null) as string[];

        if (oldImageStoragePaths.length > 0) {
          console.log(`API /api/products/[id]: Deleting old images from storage for ${productId}. Paths:`, oldImageStoragePaths.join(', '));
          const { error: removeStorageError } = await supabase.storage.from('product-images').remove(oldImageStoragePaths);
          if (removeStorageError) console.warn(`API /api/products/[id]: Failed to remove old images from storage for ${productId}: ${removeStorageError.message}`);
          else console.log(`API /api/products/[id]: Old images removed from storage for ${productId}.`);
        }

        console.log(`API /api/products/[id]: Deleting old image records from DB for ${productId}.`);
        const { error: deleteDbImagesError } = await supabase.from('product_images').delete().eq('product_id', productId);
        if (deleteDbImagesError) console.warn(`API /api/products/[id]: Failed to delete old image records from DB for ${productId}: ${deleteDbImagesError.message}`);
        else console.log(`API /api/products/[id]: Old image records deleted from DB for ${productId}.`);
      }

      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const newFilePath = `${productId}/${Date.now()}-${sanitizedFileName}`; 
      console.log(`API /api/products/[id]: Uploading new image for ${productId} to path: ${newFilePath}`);
      
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(newFilePath, imageFile, { upsert: true, contentType: imageFile.type }); 

      if (uploadErr) {
        console.error(`API /api/products/[id]: New image upload error during update for ${productId}:`, uploadErr);
        // Note: Product metadata was already updated. This part only concerns the image.
        // May want to return a specific warning.
      } else {
        console.log(`API /api/products/[id]: New image uploaded successfully for ${productId}. Getting public URL.`);
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(newFilePath);
        if (!urlData || !urlData.publicUrl) {
          console.error(`API /api/products/[id]: Failed to get public URL for new uploaded image: ${newFilePath}`);
        } else {
          console.log(`API /api/products/[id]: Inserting new image metadata for ${productId} with URL: ${urlData.publicUrl}`);
          const { error: newProductImageInsertError } = await supabase.from('product_images').insert({
            product_id: productId,
            image_url: urlData.publicUrl,
            is_primary: true,
          });
          if (newProductImageInsertError) {
            console.error(`API /api/products/[id]: New product image DB insert error for ${productId}:`, newProductImageInsertError);
          } else {
             console.log(`API /api/products/[id]: New image metadata inserted for ${productId}.`);
          }
        }
      }
    } else {
        console.log(`API /api/products/[id]: No new image file provided for product ${productId}. Image remains unchanged.`);
    }
    
    console.log(`API /api/products/[id]: Refetching final product data for ${productId} to return.`);
    const selectQuery = `
        id,
        name,
        description,
        price,
        stock,
        category_id ( id, name ),
        brand_id ( id, name ),
        product_images ( image_url, is_primary )
      `;
    const { data: finalProductData, error: finalProductFetchError } = await supabase
      .from('products')
      .select(selectQuery)
      .eq('id', productId)
      .single();

    if (finalProductFetchError || !finalProductData) {
        console.error(`API /api/products/[id]: Failed to refetch product ${productId} after update/image handling:`, finalProductFetchError);
        return NextResponse.json({ 
            success: true, 
            product: { id: productId, ...productUpdatePayload }, 
            warning: 'Product updated, but failed to retrieve final details for response.'
        }, {status: 200});
    }
    console.log(`API /api/products/[id]: Product ${productId} update process complete. Returning final data.`);
    return NextResponse.json({ success: true, product: finalProductData });

  } catch (e: unknown) {
    console.error(`API /api/products/[id]: General error in PUT handler for ID ${params.id}:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during product update.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
  
{
  "foo": "bar"
}
        
    