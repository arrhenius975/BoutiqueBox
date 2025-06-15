
// src/app/api/admin/orders/[orderId]/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export async function PUT(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const adminCheck = await isAdmin(req);
  if (!adminCheck.isAdmin && adminCheck.errorResponse) {
    return adminCheck.errorResponse;
  }
   if (!adminCheck.isAdmin) { 
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }


  try {
    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const { status } = await req.json();
    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || typeof status !== 'string' || !validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid or missing status provided. Valid statuses are: pending, paid, processing, shipped, delivered, cancelled.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      return NextResponse.json({ error: error.message || 'Failed to update order status.' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Order not found or update failed.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (e: unknown) {
    console.error('PUT /api/admin/orders/[orderId] general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
```