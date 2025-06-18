
// src/app/api/admin/orders/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { DisplayOrder } from '@/types';

// Helper to check admin role (with enhanced logging)
async function isAdminCheck(supabaseClient: ReturnType<typeof createRouteHandlerClient>): Promise<{ isAdminUser: boolean; errorResponse?: NextResponse; userId?: string; userEmail?: string; }> {
  console.log('isAdminCheck (orders API): Attempting to get user session.');
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError) {
    console.error('isAdminCheck (orders API): Auth error when calling supabase.auth.getUser():', authError.message);
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: `Auth service error: ${authError.message}` }, { status: 500 }) };
  }
  if (!user) {
    console.warn('isAdminCheck (orders API): No authenticated user found in API route. Session cookies might be missing or invalid.');
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: 'Not authenticated. No user session found in API route.' }, { status: 401 }) };
  }
  console.log(`isAdminCheck (orders API): Authenticated user found: ${user.email} (Auth ID: ${user.id})`);

  console.log(`isAdminCheck (orders API): Fetching profile for auth_id ${user.id}`);
  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (profileError) {
    console.error(`isAdminCheck (orders API): Error fetching profile for auth_id ${user.id}:`, profileError);
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: `Could not fetch user profile: ${profileError.message}` }, { status: 500 }) };
  }
  if (!profile) {
    console.warn(`isAdminCheck (orders API): Profile not found for auth_id ${user.id}`);
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: 'User profile not found.' }, { status: 404 }) };
  }
  console.log(`isAdminCheck (orders API): Profile found for auth_id ${user.id}. Role: ${profile.role}`);

  if (profile.role !== 'admin') {
    console.warn(`isAdminCheck (orders API): User ${user.email} (Auth ID: ${user.id}) is not an admin. Role: ${profile.role}`);
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 }) };
  }

  console.log(`isAdminCheck (orders API): User ${user.email} (Auth ID: ${user.id}) is an admin. Access granted.`);
  return { isAdminUser: true, userId: user.id, userEmail: user.email };
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  console.log('API /api/admin/orders: Received GET request.');
  const authCheck = await isAdminCheck(supabase);
  if (!authCheck.isAdminUser) {
    return authCheck.errorResponse || NextResponse.json({ error: 'Authentication or Authorization failed.' }, { status: 403 });
  }
  console.log(`API /api/admin/orders: Admin user ${authCheck.userEmail} (ID: ${authCheck.userId}) authorized. Fetching all orders.`);

  try {
    const { data: rawOrderData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total_amount,
        users ( id, name, email ),
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
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('API /api/admin/orders: Error fetching orders from Supabase:', ordersError);
      return NextResponse.json({ error: `Failed to fetch orders: ${ordersError.message}` }, { status: 500 });
    }
    console.log(`API /api/admin/orders: Successfully fetched ${rawOrderData?.length || 0} orders.`);

    if (!rawOrderData) {
        console.warn('API /api/admin/orders: rawOrderData is null or undefined after fetch.');
        return NextResponse.json([]); // Return empty array if no data
    }

    const formattedOrders: DisplayOrder[] = rawOrderData.map((order, index) => {
      console.log(`API /api/admin/orders: Processing order ${index + 1}/${rawOrderData.length}, ID: ${order.id}`);
      const items = (order.order_items || []).map((item: any, itemIndex: number) => {
        const product = item.products;
        const primaryImage = product?.product_images?.find((img: any) => img.is_primary === true)?.image_url;
        const productName = product?.name || 'Unknown Product';
        
        // console.log(`API /api/admin/orders: Order ID ${order.id}, Item ${itemIndex + 1}: Product Name: ${productName}, Raw Price: ${item.price}`);

        return {
          id: product?.id || `unknown-product-id-${itemIndex}`,
          name: productName,
          quantity: item.quantity || 0,
          price: parseFloat(item.price || '0'), // Ensure price is a number, default to 0 if null/undefined
          image: primaryImage || `https://placehold.co/80x80.png?text=${productName.substring(0,1).toUpperCase() || 'P'}`,
          'data-ai-hint': product?.data_ai_hint || productName.toLowerCase().split(' ')[0] || 'item',
        };
      });
      
      const userDetail = order.users ? { 
        id: order.users.id, 
        name: order.users.name, 
        email: order.users.email 
      } : undefined;
      // if (!userDetail) {
      //   console.warn(`API /api/admin/orders: Order ID ${order.id} has no associated user details.`);
      // }

      return {
        id: order.id,
        date: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(), // Fallback for date
        status: (order.status || 'unknown') as DisplayOrder['status'],
        totalAmount: parseFloat(order.total_amount || '0'), // Ensure totalAmount is a number
        items: items,
        user: userDetail,
      };
    });
    
    console.log('API /api/admin/orders: Successfully formatted all orders.');
    return NextResponse.json(formattedOrders);

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while fetching admin orders.';
    console.error('API /api/admin/orders: General error in GET handler:', errorMessage, e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
