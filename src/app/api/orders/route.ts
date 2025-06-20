
// src/app/api/orders/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { DisplayOrder } from '@/types'; // Assuming DisplayOrder includes OrderItem details

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    console.log('API /api/orders: Attempting to get user session.');
    const { data: { user: authApiUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('API /api/orders: Auth error when calling supabase.auth.getUser():', authError.message);
      return NextResponse.json({ error: `Auth service error: ${authError.message}` }, { status: 500 });
    }

    if (!authApiUser) {
      console.log('API /api/orders: No authenticated user found in API route. Session cookies might be missing or invalid.');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    console.log(`API /api/orders: Authenticated user found: ${authApiUser.email} (Auth ID: ${authApiUser.id})`);


    // Fetch the user's profile ID from public.users using their auth_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authApiUser.id)
      .single();

    if (profileError || !userProfile) {
      console.error(`API /api/orders: Error fetching user profile ID for auth_id ${authApiUser.id}:`, profileError?.message);
      return NextResponse.json({ error: 'Could not retrieve user profile to fetch orders.' }, { status: 500 });
    }
    const userId = userProfile.id;
    console.log(`API /api/orders: User profile ID for querying orders: ${userId}`);

    // Fetch orders and their items for the user
    const { data: rawOrderData, error: ordersError } = await supabase
      .from('orders')
      .select(\`
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
      \`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error(\`API /api/orders: Error fetching orders for user ID \${userId}:\`, ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
    }
    
    if (!rawOrderData) {
      console.warn(\`API /api/orders: No order data returned for user ID \${userId}, though no explicit error. Sending empty array.\`);
      return NextResponse.json([]);
    }
    console.log(\`API /api/orders: Successfully fetched \${rawOrderData.length} orders for user ID \${userId}\`);

    // Transform data to match the frontend's DisplayOrder structure
    const formattedOrders: DisplayOrder[] = rawOrderData.map(order => {
      const items = (order.order_items || []).map((item: any) => { // Ensure order.order_items is treated as an array
        const primaryImage = item.products?.product_images?.find((img: any) => img.is_primary)?.image_url;
        const productName = item.products?.name || 'Unknown Product';
        return {
          id: item.products?.id || 'unknown-product-id',
          name: productName,
          quantity: item.quantity || 0,
          price: parseFloat(item.price || '0'), // Ensure price is a number
          image: primaryImage || \`https://placehold.co/80x80.png?text=\${productName.substring(0,1).toUpperCase() || 'P'}\`,
          'data-ai-hint': item.products?.data_ai_hint || productName.toLowerCase().split(' ')[0] || 'item',
        };
      });

      return {
        id: order.id,
        date: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(), // Or format as needed
        status: (order.status || 'unknown') as DisplayOrder['status'], // Assuming DB status matches type
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
