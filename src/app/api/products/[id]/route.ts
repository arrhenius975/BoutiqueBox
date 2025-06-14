
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // 1. Get image paths from product_images table to delete from storage
    const { data: imagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', id);

    if (imagesError) {
      console.error(`Error fetching image URLs for product ${id}:`, imagesError.message);
      // Log error but attempt to proceed with deletion as primary goal.
    }

    // 2. Delete product from 'products' table. 
    // RLS policies must allow this for admins.
    // If 'ON DELETE CASCADE' is set for 'product_id' FK in 'product_images', 
    // related rows in 'product_images' will be deleted automatically.
    const { error: productDeleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (productDeleteError) {
      console.error(`Error deleting product ${id} from database:`, productDeleteError.message);
      return NextResponse.json({ error: `Failed to delete product: ${productDeleteError.message}` }, { status: 500 });
    }

    // 3. Delete images from Supabase Storage bucket
    if (imagesData && imagesData.length > 0) {
      const imagePathsToDelete: string[] = [];
      for (const img of imagesData) {
        if (img.image_url && !img.image_url.startsWith('https://placehold.co')) { // Don't try to delete placeholders
          try {
            const url = new URL(img.image_url);
            // Example URL: https://<project_ref>.supabase.co/storage/v1/object/public/product-images/<product_id>/<filename.jpg>
            // Path for storage API: <product_id>/<filename.jpg> (relative to the bucket)
            const pathSegments = url.pathname.split('/');
            // Ensure path is correctly formed: bucketName/actual/path/in/bucket
            // pathSegments will be ['', 'storage', 'v1', 'object', 'public', 'product-images', '<product_id>', '<filename.jpg>']
            if (pathSegments.length > 6 && pathSegments[5] === 'product-images') { // Index 5 is bucket name
              // The actual path for storage.remove() should be relative to the bucket e.g., "productId/fileName.jpg"
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
        const { data: storageDeleteData, error: storageDeleteError } = await supabase.storage
          .from('product-images') // Bucket name
          .remove(imagePathsToDelete);

        if (storageDeleteError) {
          console.error(`Error deleting images from storage for product ${id}:`, storageDeleteError.message);
          // Product and DB image records are deleted. Storage cleanup failed.
          // Return success but with a warning message.
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
  try {
    const { id: productId } = params;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const stockStr = formData.get('stock') as string | null;
    const category_id_str = formData.get('category_id') as string;
    const brand_id_str = formData.get('brand_id') as string | null;
    const dataAiHint = formData.get('data_ai_hint') as string | null;
    const imageFile = formData.get('imageFile') as File | null;
    // const currentImageUrl = formData.get('currentImageUrl') as string | null; // Can be used if needed

    // --- Basic Validations ---
    if (!name || !priceStr || !category_id_str) {
      return NextResponse.json({ error: 'Missing required fields: name, price, category_id' }, { status: 400 });
    }
    // --- End Basic Validations ---

    const price = parseFloat(priceStr);
    const stock = stockStr ? parseInt(stockStr, 10) : 0;
    const category_id = parseInt(category_id_str, 10);
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '') ? parseInt(brand_id_str, 10) : null;

    if (isNaN(price) || isNaN(stock) || isNaN(category_id)) {
      return NextResponse.json({ error: 'Invalid numeric value for price, stock, or category_id' }, { status: 400 });
    }
    if (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && isNaN(brand_id as number)) {
        return NextResponse.json({ error: 'Invalid numeric value for brand_id' }, { status: 400 });
    }

    const productUpdatePayload: {
      name: string;
      description?: string;
      price: number;
      stock: number;
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

    // 1. Update product details in 'products' table
    const { data: updatedProductData, error: productUpdateError } = await supabase
      .from('products')
      .update(productUpdatePayload)
      .eq('id', productId)
      .select()
      .single();

    if (productUpdateError || !updatedProductData) {
      console.error('Product update error:', productUpdateError);
      return NextResponse.json({ error: productUpdateError?.message || 'Product update failed' }, { status: 500 });
    }

    // 2. Handle image update if a new imageFile is provided
    if (imageFile && imageFile.size > 0) {
      // Optional: Delete old image(s) for this product from storage
      // This requires fetching old image URLs first.
      const { data: oldImages, error: oldImagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (oldImagesError) {
        console.warn(`Could not fetch old images for product ${productId} during update. Skipping deletion of old images.`, oldImagesError);
      } else if (oldImages && oldImages.length > 0) {
        const oldImagePaths = oldImages.map(img => {
          if (img.image_url && !img.image_url.startsWith('https://placehold.co')) {
            try {
              const url = new URL(img.image_url);
              const pathSegments = url.pathname.split('/');
              if (pathSegments.length > 6 && pathSegments[5] === 'product-images') {
                return pathSegments.slice(6).join('/');
              }
            } catch (e) { /* ignore invalid old URLs */ }
          }
          return null;
        }).filter(path => path !== null) as string[];

        if (oldImagePaths.length > 0) {
          await supabase.storage.from('product-images').remove(oldImagePaths);
        }
        // Delete old entries from product_images table
        await supabase.from('product_images').delete().eq('product_id', productId);
      }

      // Upload new image
      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const newFilePath = `product-images/${productId}/${Date.now()}-${sanitizedFileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(newFilePath, imageFile, { upsert: false, contentType: imageFile.type }); // upsert false, as we are replacing

      if (uploadErr) {
        console.error('New image upload error during update:', uploadErr);
        // Product details updated, but new image upload failed.
        return NextResponse.json({ error: `Product details updated, but new image upload failed: ${uploadErr.message}` }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(newFilePath);
      if (!urlData || !urlData.publicUrl) {
        console.error('Failed to get public URL for new uploaded image:', newFilePath);
        return NextResponse.json({ error: `Product details updated, image uploaded, but failed to get public URL.` }, { status: 500 });
      }
      const newPublicUrl = urlData.publicUrl;

      // Save new image URL to 'product_images' table
      const { error: newProductImageInsertError } = await supabase.from('product_images').insert({
        product_id: productId,
        image_url: newPublicUrl,
        is_primary: true,
      });

      if (newProductImageInsertError) {
        console.error('New product image DB insert error during update:', newProductImageInsertError);
        return NextResponse.json({ error: `Product updated, image uploaded, but linking new image failed: ${newProductImageInsertError.message}` }, { status: 500 });
      }
      // Attach new image to response for client
      updatedProductData.image = newPublicUrl; 
    }


    return NextResponse.json({ success: true, product: updatedProductData });

  } catch (e: unknown) {
    console.error(`PUT /api/products/[id] general error:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    
