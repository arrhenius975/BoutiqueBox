
// src/app/api/orders/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { DisplayOrder } from '@/types'; // Assuming DisplayOrder includes OrderItem details

export async function GET(req: NextRequest) {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Fetch the user's profile ID from public.users using their auth_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile ID:', profileError);
      return NextResponse.json({ error: 'Could not retrieve user profile.' }, { status: 500 });
    }
    const userId = userProfile.id;

    // Fetch orders and their items for the user
    const { data: rawOrderData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total_amount,
        order_items (
          quantity,
          price,
          products (
            id,
            name,
            data_ai_hint,
            product_images (
              image_url,
              is_primary
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
    }

    // Transform data to match the frontend's DisplayOrder structure
    const formattedOrders: DisplayOrder[] = rawOrderData.map(order => {
      const items = order.order_items.map((item: any) => {
        const primaryImage = item.products?.product_images?.find((img: any) => img.is_primary)?.image_url;
        const productName = item.products?.name || 'Unknown Product';
        return {
          id: item.products?.id || 'unknown-product-id',
          name: productName,
          quantity: item.quantity,
          price: parseFloat(item.price), // Ensure price is a number
          image: primaryImage || `https://placehold.co/80x80.png?text=${productName.substring(0,1)}`,
          'data-ai-hint': item.products?.data_ai_hint || productName.toLowerCase().split(' ')[0] || 'item',
        };
      });

      return {
        id: order.id,
        date: new Date(order.created_at).toISOString(), // Or format as needed
        status: order.status as DisplayOrder['status'], // Assuming DB status matches type
        totalAmount: parseFloat(order.total_amount || '0'), // Ensure totalAmount is a number
        items: items,
      };
    });

    return NextResponse.json(formattedOrders);

  } catch (e: unknown) {
    console.error('GET /api/orders general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
