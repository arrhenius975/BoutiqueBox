
// src/app/api/admin/orders/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { DisplayOrder } from '@/types';

// Helper to check admin role (with enhanced logging)
async function isAdminCheck(req: NextRequest): Promise<{ isAdminUser: boolean; errorResponse?: NextResponse; userId?: string; userEmail?: string; }> {
  console.log('isAdminCheck: Attempting to get user session.');
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('isAdminCheck: Auth error when calling supabase.auth.getUser():', authError.message);
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: `Auth service error: ${authError.message}` }, { status: 500 }) };
  }
  if (!user) {
    console.warn('isAdminCheck: No authenticated user found in API route. Session cookies might be missing or invalid.');
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: 'Not authenticated. No user session found in API route.' }, { status: 401 }) };
  }
  console.log(`isAdminCheck: Authenticated user found: ${user.email} (Auth ID: ${user.id})`);

  console.log(`isAdminCheck: Fetching profile for auth_id ${user.id}`);
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
  
  if (profileError) {
    console.error(`isAdminCheck: Error fetching profile for auth_id ${user.id}:`, profileError);
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: `Could not fetch user profile: ${profileError.message}` }, { status: 500 }) };
  }
  if (!profile) {
    console.warn(`isAdminCheck: Profile not found for auth_id ${user.id}`);
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: 'User profile not found.' }, { status: 404 }) };
  }
  console.log(`isAdminCheck: Profile found for auth_id ${user.id}. Role: ${profile.role}`);

  if (profile.role !== 'admin') {
    console.warn(`isAdminCheck: User ${user.email} (Auth ID: ${user.id}) is not an admin. Role: ${profile.role}`);
    return { isAdminUser: false, errorResponse: NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 }) };
  }

  console.log(`isAdminCheck: User ${user.email} (Auth ID: ${user.id}) is an admin. Access granted.`);
  return { isAdminUser: true, userId: user.id, userEmail: user.email };
}

export async function GET(req: NextRequest) {
  console.log('API /api/admin/orders: Received GET request.');
  const authCheck = await isAdminCheck(req);
  if (!authCheck.isAdminUser) {
    return authCheck.errorResponse || NextResponse.json({ error: 'Authentication or Authorization failed.' }, { status: 403 });
  }
  console.log(`API /api/admin/orders: Admin user ${authCheck.userEmail} (ID: ${authCheck.userId}) authorized. Fetching all orders.`);

  try {
    const { data: rawOrderData, error: ordersError } = await supabase
      .from('orders')
      .select(\`
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
      \`)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('API /api/admin/orders: Error fetching orders from Supabase:', ordersError);
      return NextResponse.json({ error: `Failed to fetch orders: ${ordersError.message}` }, { status: 500 });
    }
    console.log(`API /api/admin/orders: Successfully fetched ${rawOrderData.length} orders.`);

    const formattedOrders: DisplayOrder[] = rawOrderData.map(order => {
      const items = order.order_items.map((item: any) => {
        const primaryImage = item.products?.product_images?.find((img: any) => img.is_primary)?.image_url;
        const productName = item.products?.name || 'Unknown Product';
        return {
          id: item.products?.id || 'unknown-product-id',
          name: productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          image: primaryImage || \`https://placehold.co/80x80.png?text=\${productName.substring(0,1)}\`,
          'data-ai-hint': item.products?.data_ai_hint || productName.toLowerCase().split(' ')[0] || 'item',
        };
      });

      return {
        id: order.id,
        date: new Date(order.created_at).toISOString(),
        status: order.status as DisplayOrder['status'],
        totalAmount: parseFloat(order.total_amount || '0'),
        items: items,
        user: order.users ? { id: order.users.id, name: order.users.name, email: order.users.email } : undefined,
      };
    });

    return NextResponse.json(formattedOrders);

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while fetching admin orders.';
    console.error('API /api/admin/orders: General error in GET handler:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
