
import { supabase } from '@/data/supabase'; // Reverted to global client
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to check admin role
async function isAdmin(): Promise<boolean> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return false;

  const { data: profile, error: profileError } = await supabase
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
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { data: imagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', id);

    if (imagesError) {
      console.warn(`Error fetching image URLs for product ${id}:`, imagesError.message);
    }

    const { error: productDeleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (productDeleteError) {
      console.error(`Error deleting product ${id} from database:`, productDeleteError.message);
      return NextResponse.json({ error: `Failed to delete product: ${productDeleteError.message}` }, { status: 500 });
    }

    if (imagesData && imagesData.length > 0) {
      const imagePathsToDelete: string[] = [];
      for (const img of imagesData) {
        if (img.image_url && !img.image_url.startsWith('https://placehold.co')) {
          try {
            const url = new URL(img.image_url);
            const pathSegments = url.pathname.split('/');
            if (pathSegments.length > 6 && pathSegments[5] === 'product-images') { // supabase-project-ref/storage/v1/object/public/product-images/...
              imagePathsToDelete.push(pathSegments.slice(6).join('/'));
            } else {
               console.warn(`Could not parse path from image URL for deletion: ${img.image_url}`);
            }
          } catch (e) {
            console.warn(`Invalid image URL found during delete operation for product ${id}: ${img.image_url}`, e);
          }
        }
      }

      if (imagePathsToDelete.length > 0) {
        const { error: storageDeleteError } = await supabase.storage
          .from('product-images')
          .remove(imagePathsToDelete);

        if (storageDeleteError) {
          console.warn(`Error deleting images from storage for product ${id}:`, storageDeleteError.message);
          return NextResponse.json({
            success: true,
            message: `Product deleted from database, but failed to cleanup some images from storage: ${storageDeleteError.message}. Check RLS policies for storage.objects table for DELETE operation.`
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Product and associated images/records deleted successfully.' });

  } catch (e: unknown) {
    console.error(`DELETE /api/products/[id] general error:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }
  try {
    const { id: productId } = params;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const category_id_str = formData.get('category_id') as string;
    const brand_id_str = formData.get('brand_id') as string | null;
    const dataAiHint = formData.get('data_ai_hint') as string | null;
    const imageFile = formData.get('imageFile') as File | null;
    const stockStr = formData.get('stock') as string | null; 


    if (!name || !priceStr || !category_id_str || !stockStr) { 
      return NextResponse.json({ error: 'Missing required fields: name, price, stock, category_id' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    const category_id = parseInt(category_id_str, 10);
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '') ? parseInt(brand_id_str, 10) : null;
    const stock = parseInt(stockStr, 10); 

    if (isNaN(price) || isNaN(category_id) || isNaN(stock) ) { 
      return NextResponse.json({ error: 'Invalid numeric value for price, category_id, or stock' }, { status: 400 });
    }
     if (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && isNaN(brand_id as number)) {
        return NextResponse.json({ error: 'Invalid numeric value for brand_id' }, { status: 400 });
    }


    const productUpdatePayload: {
      name: string;
      description?: string;
      price: number;
      stock?: number;
      category_id: number;
      brand_id?: number | null;
      data_ai_hint?: string | null;
      updated_at: string;
    } = {
      name,
      description: description || undefined,
      price,
      stock, 
      category_id,
      brand_id: brand_id,
      data_ai_hint: dataAiHint || name.toLowerCase().split(" ")[0] || "product",
      updated_at: new Date().toISOString(),
    };


    const { data: updatedProductData, error: productUpdateError } = await supabase
      .from('products')
      .update(productUpdatePayload)
      .eq('id', productId)
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
      .single();

    if (productUpdateError || !updatedProductData) {
      console.error('Product update error:', productUpdateError?.message);
      return NextResponse.json({ error: productUpdateError?.message || 'Product update failed' }, { status: 500 });
    }

    let finalImageUrl = updatedProductData.product_images?.find(img => img.is_primary)?.image_url;

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
              if (pathSegments.length > 6 && pathSegments[5] === 'product-images') {
                return pathSegments.slice(6).join('/');
              }
            } catch (e) { console.warn(`Invalid old image URL format: ${img.image_url}`); }
          }
          return null;
        }).filter(path => path !== null) as string[];

        if (oldImageStoragePaths.length > 0) {
          const { error: removeError } = await supabase.storage.from('product-images').remove(oldImageStoragePaths);
          if (removeError) console.warn(`Failed to remove old images from storage for ${productId}: ${removeError.message}`);
        }

        const { error: deleteDbImagesError } = await supabase.from('product_images').delete().eq('product_id', productId);
        if (deleteDbImagesError) console.warn(`Failed to delete old image records from DB for ${productId}: ${deleteDbImagesError.message}`);
      }

      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const newFilePath = `product-images/${productId}/${Date.now()}-${sanitizedFileName}`; // Changed to subfolder

      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(newFilePath, imageFile, { upsert: true, contentType: imageFile.type }); // Changed to true

      if (uploadErr) {
        console.error('New image upload error during update:', uploadErr);
        return NextResponse.json({ error: `Product details updated, but new image upload failed: ${uploadErr.message}. Product ID: ${productId}` }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(newFilePath);
      if (!urlData || !urlData.publicUrl) {
        console.error('Failed to get public URL for new uploaded image:', newFilePath);
        return NextResponse.json({ error: `Product updated, image uploaded, but failed to get public URL. Product ID: ${productId}` }, { status: 500 });
      }
      finalImageUrl = urlData.publicUrl;

      const { error: newProductImageInsertError } = await supabase.from('product_images').insert({
        product_id: productId,
        image_url: finalImageUrl,
        is_primary: true,
      });

      if (newProductImageInsertError) {
        console.error('New product image DB insert error:', newProductImageInsertError);
        return NextResponse.json({ error: `Product updated, image uploaded, but linking new image in DB failed: ${newProductImageInsertError.message}. Product ID: ${productId}` }, { status: 500 });
      }
    }

    const { data: finalProductData, error: finalProductFetchError } = await supabase
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
      .eq('id', productId)
      .single();

    if (finalProductFetchError || !finalProductData) {
        console.error('Failed to refetch product after update/image handling:', finalProductFetchError);
        return NextResponse.json({ error: 'Failed to retrieve final product data after update.'}, {status: 500});
    }


    return NextResponse.json({ success: true, product: finalProductData });

  } catch (e: unknown) {
    console.error(`PUT /api/products/[id] general error:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
