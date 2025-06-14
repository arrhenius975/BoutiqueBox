
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
        if (img.image_url && !img.image_url.startsWith('https://placehold.co')) { 
          try {
            const url = new URL(img.image_url);
            const pathSegments = url.pathname.split('/');
            if (pathSegments.length > 6 && pathSegments[5] === 'product-images') { 
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
          .from('product-images') 
          .remove(imagePathsToDelete);

        if (storageDeleteError) {
          console.error(`Error deleting images from storage for product ${id}:`, storageDeleteError.message);
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
    // const stockStr = formData.get('stock') as string | null; // Assuming stock might be optional or not managed here
    const category_id_str = formData.get('category_id') as string;
    const brand_id_str = formData.get('brand_id') as string | null; // Assuming brand_id might be optional
    const dataAiHint = formData.get('data_ai_hint') as string | null;
    const imageFile = formData.get('imageFile') as File | null;
    // const currentImageUrl = formData.get('currentImageUrl') as string | null; // URL of the existing image if not changing

    // --- Basic Validations ---
    if (!name || !priceStr || !category_id_str) {
      return NextResponse.json({ error: 'Missing required fields: name, price, category_id' }, { status: 400 });
    }
    // --- End Basic Validations ---

    const price = parseFloat(priceStr);
    // const stock = stockStr ? parseInt(stockStr, 10) : 0; // Default stock if not provided
    const category_id = parseInt(category_id_str, 10);
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '') ? parseInt(brand_id_str, 10) : null;

    if (isNaN(price) || isNaN(category_id)) { // Removed stock from this check
      return NextResponse.json({ error: 'Invalid numeric value for price or category_id' }, { status: 400 });
    }
    if (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '' && isNaN(brand_id as number)) {
        return NextResponse.json({ error: 'Invalid numeric value for brand_id' }, { status: 400 });
    }

    const productUpdatePayload: {
      name: string;
      description?: string;
      price: number;
      // stock?: number; // Include if managing stock
      category_id: number;
      brand_id?: number | null;
      data_ai_hint?: string | null;
      updated_at: string;
    } = {
      name,
      description: description || undefined,
      price,
      // stock, // Include if managing stock
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
      .select() // Important to select to get the updated product data
      .single();

    if (productUpdateError || !updatedProductData) {
      console.error('Product update error:', productUpdateError);
      return NextResponse.json({ error: productUpdateError?.message || 'Product update failed' }, { status: 500 });
    }

    let newPublicUrl = updatedProductData.image; // Assume existing image initially

    // 2. Handle image update if a new imageFile is provided
    if (imageFile && imageFile.size > 0) {
      // Delete old image(s) for this product from storage and product_images table
      const { data: oldImages, error: oldImagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (oldImagesError) {
        console.warn(`Could not fetch old images for product ${productId} during update. Skipping deletion of old images. Error: ${oldImagesError.message}`);
      } else if (oldImages && oldImages.length > 0) {
        const oldImageStoragePaths = oldImages.map(img => {
          if (img.image_url && !img.image_url.startsWith('https://placehold.co')) {
            try {
              const url = new URL(img.image_url);
              const pathSegments = url.pathname.split('/');
              // Example path: /storage/v1/object/public/product-images/product_id/filename.jpg
              // Storage API path: product_id/filename.jpg
              if (pathSegments.length > 6 && pathSegments[5] === 'product-images') {
                return pathSegments.slice(6).join('/');
              }
            } catch (e) { console.warn(`Invalid old image URL: ${img.image_url}`); }
          }
          return null;
        }).filter(path => path !== null) as string[];

        if (oldImageStoragePaths.length > 0) {
          const { error: removeError } = await supabase.storage.from('product-images').remove(oldImageStoragePaths);
          if (removeError) console.warn(`Failed to remove old images from storage for ${productId}: ${removeError.message}`);
        }
        // Delete old entries from product_images table regardless of storage deletion success
        const { error: deleteDbImagesError } = await supabase.from('product_images').delete().eq('product_id', productId);
        if (deleteDbImagesError) console.warn(`Failed to delete old image records from DB for ${productId}: ${deleteDbImagesError.message}`);
      }

      // Upload new image
      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      // Store images in a folder named by product ID for organization
      const newFilePath = `${productId}/${Date.now()}-${sanitizedFileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('product-images') // Bucket name
        .upload(newFilePath, imageFile, { upsert: false, contentType: imageFile.type }); 

      if (uploadErr) {
        console.error('New image upload error during update:', uploadErr);
        return NextResponse.json({ error: `Product details updated, but new image upload failed: ${uploadErr.message}` }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(newFilePath);
      if (!urlData || !urlData.publicUrl) {
        console.error('Failed to get public URL for new uploaded image:', newFilePath);
        return NextResponse.json({ error: `Product details updated, image uploaded, but failed to get public URL.` }, { status: 500 });
      }
      newPublicUrl = urlData.publicUrl;

      // Save new image URL to 'product_images' table
      const { error: newProductImageInsertError } = await supabase.from('product_images').insert({
        product_id: productId,
        image_url: newPublicUrl,
        is_primary: true, // Assume the new uploaded image is the primary one
      });

      if (newProductImageInsertError) {
        console.error('New product image DB insert error during update:', newProductImageInsertError);
        return NextResponse.json({ error: `Product updated, image uploaded, but linking new image failed: ${newProductImageInsertError.message}` }, { status: 500 });
      }
    }
    
    // Construct the product object to return, ensuring it has the image URL
    const finalProductData = {
        ...updatedProductData,
        image: newPublicUrl, // Use the new URL if uploaded, or the existing one if not
         // Mock category and brand for immediate UI update if not fully selected from DB.
        category_id: { id: category_id, name: allPossibleCategories.find(c => c.id === category_id)?.label || 'Unknown' },
        brand_id: brand_id ? { id: brand_id, name: 'MockBrand' } : null,
        product_images: [{ image_url: newPublicUrl, is_primary: true }] 
    };


    return NextResponse.json({ success: true, product: finalProductData });

  } catch (e: unknown) {
    console.error(`PUT /api/products/[id] general error:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper data (simplified, ensure your `allPossibleCategories` on the frontend is the source of truth for labels)
const allPossibleCategories: { id: number; value: string; label: string; section: string }[] = [
  { id: 1, value: 'meats', label: 'Meats', section: 'grocery' },
  { id: 2, value: 'vegetables', label: 'Vegetables', section: 'grocery' },
  { id: 100, value: 'electronics', label: 'Electronics', section: 'tech' },
  // ... add all other categories your frontend uses
];
