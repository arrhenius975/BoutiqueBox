// src/app/api/admin/orders/[orderId]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper to check admin role
async function isAdmin(supabaseClient: ReturnType<typeof createRouteHandlerClient>): Promise<{ isAdmin: boolean; errorResponse?: NextResponse; userId?: string; userEmail?: string; }> {
  console.log('isAdminCheck (orderId API): Attempting to get user session.');
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError) {
    console.error('isAdminCheck (orderId API): Auth error when calling supabase.auth.getUser():', authError.message);
    return { isAdmin: false, errorResponse: NextResponse.json({ error: `Auth service error: ${authError.message}` }, { status: 500 }) };
  }
  if (!user) {
    console.warn('isAdminCheck (orderId API): No authenticated user found in API route.');
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Not authenticated. No user session found in API route.' }, { status: 401 }) };
  }
  console.log(`isAdminCheck (orderId API): Authenticated user found: ${user.email} (Auth ID: ${user.id})`);

  console.log(`isAdminCheck (orderId API): Fetching profile for auth_id ${user.id}`);
  const { data: profile, error: profileError } = await supabaseClient
    .from('users') // Ensure this is 'users', not 'profiles'
    .select('role')
    .eq('auth_id', user.id) // Match against the auth_id in your users table
    .single();

  if (profileError) {
    console.error(`isAdminCheck (orderId API): Error fetching profile for auth_id ${user.id}:`, profileError);
    return { isAdmin: false, errorResponse: NextResponse.json({ error: `Could not fetch user profile: ${profileError.message}` }, { status: 500 }) };
  }
  if (!profile) {
    console.warn(`isAdminCheck (orderId API): Profile not found for auth_id ${user.id}`);
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'User profile not found.' }, { status: 404 }) };
  }
  console.log(`isAdminCheck (orderId API): Profile found for auth_id ${user.id}. Role: ${profile.role}`);

  if (profile.role !== 'admin') {
    console.warn(`isAdminCheck (orderId API): User ${user.email} (Auth ID: ${user.id}) is not an admin. Role: ${profile.role}`);
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 }) };
  }

  console.log(`isAdminCheck (orderId API): User ${user.email} (Auth ID: ${user.id}) is an admin. Access granted.`);
  return { isAdmin: true, userId: user.id, userEmail: user.email };
}

export async function PUT(
  request: Request, // Use standard Web API Request type
  { params }: { params: { orderId: string } } // Correct signature for App Router dynamic routes
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const adminCheck = await isAdmin(supabase);
  if (!adminCheck.isAdmin || !adminCheck.errorResponse === undefined ) { // Ensure no errorResponse from isAdmin
    return adminCheck.errorResponse || NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }
  console.log(`API /api/admin/orders/[orderId]: Admin user ${adminCheck.userEmail} (ID: ${adminCheck.userId}) authorized for PUT.`);

  try {
    const { orderId } = params;
    if (!orderId) {
      console.warn('API /api/admin/orders/[orderId]: Order ID missing in params.');
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const body = await request.json(); // Get body from the standard Request object
    const { status } = body;
    
    console.log(`API /api/admin/orders/[orderId]: Attempting to update order ${orderId} to status ${status}.`);

    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || typeof status !== 'string' || !validStatuses.includes(status.toLowerCase())) {
      console.warn(`API /api/admin/orders/[orderId]: Invalid status "${status}" provided for order ${orderId}.`);
      return NextResponse.json({ error: 'Invalid or missing status provided. Valid statuses are: pending, paid, processing, shipped, delivered, cancelled.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error(`API /api/admin/orders/[orderId]: Error updating order ${orderId} status:`, error);
      if (error.code === 'PGRST116') { // Resource not found
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update order status.' }, { status: 500 });
    }

    if (!data) {
      // This case should ideally be caught by PGRST116, but good to have a fallback.
      console.warn(`API /api/admin/orders/[orderId]: Order ${orderId} not found after update attempt, though no Supabase error.`);
      return NextResponse.json({ error: 'Order not found or update failed after query.' }, { status: 404 });
    }
    
    console.log(`API /api/admin/orders/[orderId]: Successfully updated order ${orderId} to status ${status}.`);
    return NextResponse.json({ success: true, order: data });

  } catch (e: unknown) {
    console.error('PUT /api/admin/orders/[orderId] general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    if (e instanceof SyntaxError && e.message.includes("JSON")) {
        return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
