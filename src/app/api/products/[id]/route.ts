
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
            // Path for storage API: <product_id>/<filename.jpg>
            const pathSegments = url.pathname.split('/');
            // Ensure path is correctly formed: bucketName/productId/fileName
            // pathSegments will be ['', 'storage', 'v1', 'object', 'public', 'product-images', '<product_id>', '<filename.jpg>']
            if (pathSegments.length > 7 && pathSegments[5] === 'product-images') {
              imagePathsToDelete.push(`${pathSegments[6]}/${pathSegments[7]}`);
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

    return NextResponse.json({ success: true, message: 'Product and associated database image records deleted successfully.' });

  } catch (e: unknown) {
    console.error(`DELETE /api/products/[id] general error:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    