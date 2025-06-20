// src/app/api/admin/orders/[orderId]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper to check admin role
async function isAdmin(supabaseClient: ReturnType<typeof createRouteHandlerClient>): Promise<{ isAdmin: boolean; errorResponse?: NextResponse }> {
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('users') // Assuming your profiles table is 'users'
    .select('role')
    .eq('auth_id', user.id) // Match against the auth_id in your users table
    .single();

  if (profileError || !profile) {
    console.error('Error fetching user profile for admin check:', profileError?.message);
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Could not fetch user profile.' }, { status: 500 }) };
  }
  if (profile.role !== 'admin') {
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 }) };
  }
  return { isAdmin: true };
}

export async function PUT(
  request: Request, // Standard Web API Request type
  { params }: { params: { orderId: string } } // Correct signature for App Router dynamic routes
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const adminCheck = await isAdmin(supabase);
  if (!adminCheck.isAdmin) {
    // If errorResponse is present, return it, otherwise default to 403
    return adminCheck.errorResponse || NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { orderId } = params; // Destructure orderId from params
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const body = await request.json(); // Get body from the standard Request object
    const { status } = body;
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
      // Check for specific Supabase errors, e.g., order not found by ID
      if (error.code === 'PGRST116') { // Resource not found
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update order status.' }, { status: 500 });
    }

    // Although select().single() should error if not found (PGRST116), an extra check doesn't hurt
    if (!data) {
      return NextResponse.json({ error: 'Order not found or update failed after query.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (e: unknown) {
    console.error('PUT /api/admin/orders/[orderId] general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    // Handle JSON parsing errors specifically if 'e' indicates it
    if (e instanceof SyntaxError && e.message.includes("JSON")) {
        return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
