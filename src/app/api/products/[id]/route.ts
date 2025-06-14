
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Product } from '@/types'; // Assuming Product type is defined

// Helper function to get category label - replace with actual DB query if needed for response
const getCategoryLabel = (categoryId: number) => {
    const categories = [
      { id: 1, value: 'meats', label: 'Meats', section: 'grocery' },
      { id: 2, value: 'vegetables', label: 'Vegetables', section: 'grocery' },
      { id: 3, value: 'fruits', label: 'Fruits', section: 'grocery' },
      { id: 4, value: 'breads', label: 'Breads', section: 'grocery' },
      { id: 5, value: 'skincare', label: 'Skincare', section: 'cosmetics' },
      { id: 6, value: 'makeup', label: 'Makeup', section: 'cosmetics' },
      { id: 7, value: 'fragrance', label: 'Fragrance', section: 'cosmetics' },
      { id: 8, value: 'burgers', label: 'Burgers', section: 'fastfood' },
      { id: 9, value: 'pizza', label: 'Pizza', section: 'fastfood' },
      { id: 10, value: 'sides', label: 'Sides', section: 'fastfood' },
      { id: 11, value: 'drinks', label: 'Drinks', section: 'fastfood' },
      { id: 100, value: 'electronics', label: 'Electronics', section: 'tech' },
      { id: 101, value: 'clothing', label: 'Clothing', section: 'fashion' },
      { id: 102, value: 'books', label: 'Books', section: 'literature' },
    ];
    return categories.find(c => c.id === categoryId)?.label || 'Unknown Category';
};


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
    // related rows in 'product_images' will be deleted automatically from the table.
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
            // Assumes URL structure: .../storage/v1/object/public/bucket-name/path/to/image.jpg
            // We need 'path/to/image.jpg' for the .remove() method.
            const pathSegments = url.pathname.split('/');
            // Example: /storage/v1/object/public/product-images/product-id/image.jpg -> segments: ['', 'storage', 'v1', 'object', 'public', 'product-images', 'product-id', 'image.jpg']
            // We want the parts after 'product-images', which is index 6 and onwards.
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
          // Don't fail the whole request if DB deletion was successful but storage cleanup partially failed.
          // Log it or return a specific message.
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
    const category_id_str = formData.get('category_id') as string;
    const brand_id_str = formData.get('brand_id') as string | null;
    const dataAiHint = formData.get('data_ai_hint') as string | null;
    const imageFile = formData.get('imageFile') as File | null;
    // currentImageUrl is not directly used by backend for update logic, but was for frontend logic
    // const currentImageUrl = formData.get('currentImageUrl') as string | null;

    if (!name || !priceStr || !category_id_str) {
      return NextResponse.json({ error: 'Missing required fields: name, price, category_id' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    const category_id = parseInt(category_id_str, 10);
    const brand_id = (brand_id_str && brand_id_str !== 'null' && brand_id_str.trim() !== '') ? parseInt(brand_id_str, 10) : null;
    const stock = formData.get('stock') ? parseInt(formData.get('stock') as string, 10) : 0; // Assuming stock might be sent

    if (isNaN(price) || isNaN(category_id) || isNaN(stock)) {
      return NextResponse.json({ error: 'Invalid numeric value for price, category_id, or stock' }, { status: 400 });
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

    const { data: updatedProductData, error: productUpdateError } = await supabase
      .from('products')
      .update(productUpdatePayload)
      .eq('id', productId)
      .select()
      .single();

    if (productUpdateError || !updatedProductData) {
      console.error('Product update error:', productUpdateError?.message);
      return NextResponse.json({ error: productUpdateError?.message || 'Product update failed' }, { status: 500 });
    }

    let newPublicUrl: string | undefined;
    // Fetch current primary image to compare later if no new image is uploaded
    const { data: currentImage, error: currentImageError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .single();
    
    if(currentImageError && currentImageError.code !== 'PGRST116') { // PGRST116: no rows found
        console.warn('Could not fetch current primary image during update:', currentImageError.message);
    }
    newPublicUrl = currentImage?.image_url;


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
      const newFilePath = `${productId}/${Date.now()}-${sanitizedFileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(newFilePath, imageFile, { upsert: false, contentType: imageFile.type }); 

      if (uploadErr) {
        console.error('New image upload error during update:', uploadErr);
        return NextResponse.json({ error: `Product details updated, but new image upload failed: ${uploadErr.message}` }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(newFilePath);
      if (!urlData || !urlData.publicUrl) {
        console.error('Failed to get public URL for new uploaded image:', newFilePath);
        return NextResponse.json({ error: `Product updated, image uploaded, but failed to get public URL.` }, { status: 500 });
      }
      newPublicUrl = urlData.publicUrl;

      const { error: newProductImageInsertError } = await supabase.from('product_images').insert({
        product_id: productId,
        image_url: newPublicUrl,
        is_primary: true,
      });

      if (newProductImageInsertError) {
        console.error('New product image DB insert error:', newProductImageInsertError);
        return NextResponse.json({ error: `Product updated, image uploaded, but linking new image failed: ${newProductImageInsertError.message}` }, { status: 500 });
      }
    }
    
    const finalProductData = {
        ...updatedProductData,
        image: newPublicUrl || `https://placehold.co/100x100.png?text=${name.substring(0,1)}`, // Fallback if no image
        category_id: { id: category_id, name: getCategoryLabel(category_id) }, // Simplified response for category
        brand_id: brand_id ? { id: brand_id, name: 'MockBrand' } : null, // Simplified response for brand
        product_images: newPublicUrl ? [{ image_url: newPublicUrl, is_primary: true }] : [],
    };

    return NextResponse.json({ success: true, product: finalProductData });

  } catch (e: unknown) {
    console.error(`PUT /api/products/[id] general error:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    