
// src/app/api/admin/orders/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { DisplayOrder } from '@/types';

// Helper to check admin role
async function isAdmin(req: NextRequest): Promise<{ isAdmin: boolean; errorResponse?: NextResponse }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
  
  if (profileError || !profile) {
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Could not fetch user profile.' }, { status: 500 }) };
  }
  if (profile.role !== 'admin') {
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 }) };
  }
  return { isAdmin: true };
}

export async function GET(req: NextRequest) {
  const adminCheck = await isAdmin(req);
  if (!adminCheck.isAdmin && adminCheck.errorResponse) {
    return adminCheck.errorResponse;
  }
  if (!adminCheck.isAdmin) { // Fallback if errorResponse is not set for some reason
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

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
      console.error('API /api/admin/orders: Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
    }

    const formattedOrders: DisplayOrder[] = rawOrderData.map(order => {
      const items = order.order_items.map((item: any) => {
        const primaryImage = item.products?.product_images?.find((img: any) => img.is_primary)?.image_url;
        const productName = item.products?.name || 'Unknown Product';
        return {
          id: item.products?.id || 'unknown-product-id',
          name: productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          image: primaryImage || `https://placehold.co/80x80.png?text=${productName.substring(0,1)}`,
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
    console.error('GET /api/admin/orders general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
```