
// src/app/api/admin/analytics/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// IMPORTANT: You need to create these PostgreSQL functions/views in your Supabase project.
// Example SQL for these views/functions can be found in comments below or on the Admin Dashboard page.

export async function GET(req: NextRequest) {
  const cookieStore = cookies(); // Corrected: removed await
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  console.log('API /api/admin/analytics: Received GET request.');
  try {
    console.log('API /api/admin/analytics: Attempting to get user session.');
    const { data: { user: authApiUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('API /api/admin/analytics: Auth error when calling supabase.auth.getUser():', authError.message);
      return NextResponse.json({ error: `Auth service error: ${authError.message}` }, { status: 500 });
    }

    if (!authApiUser) {
      console.warn('API /api/admin/analytics: No authenticated user found in API route. Session cookies might be missing or invalid.');
      return NextResponse.json({ error: 'User not authenticated. No session found in API route.' }, { status: 401 });
    }
    console.log(`API /api/admin/analytics: Authenticated user found: ${authApiUser.email} (Auth ID: ${authApiUser.id})`);

    console.log(`API /api/admin/analytics: Fetching profile for auth_id ${authApiUser.id}`);
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', authApiUser.id)
        .single();
    
    if (profileError) {
      console.error(`API /api/admin/analytics: Error fetching profile for auth_id ${authApiUser.id}:`, profileError);
      return NextResponse.json({ error: `Could not fetch user profile: ${profileError.message}` }, { status: 500 });
    }
    if (!profile) {
        console.warn(`API /api/admin/analytics: Profile not found for auth_id ${authApiUser.id}`);
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    console.log(`API /api/admin/analytics: Profile found for auth_id ${authApiUser.id}. Role: ${profile.role}`);

    if (profile.role !== 'admin') {
      console.warn(`API /api/admin/analytics: User ${authApiUser.email} (Auth ID: ${authApiUser.id}) is not an admin. Role: ${profile.role}`);
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }
    console.log(`API /api/admin/analytics: User ${authApiUser.email} is admin. Proceeding to fetch analytics.`);


    const [
        revenueData, 
        inventoryData, 
        signupsData,
        totalOrdersData,
        activeUsersCountData,
        ordersLast30DaysCountData
    ] = await Promise.all([
      supabase.from('revenue_over_time').select('*'),
      supabase.from('inventory_status').select('*'),
      supabase.from('new_signups_over_time').select('*'),
      supabase.from('orders').select('id', { count: 'exact', head: true }), // Total orders
      supabase.from('active_users_count_last_30_days').select('count').single(), // Assumes view exists
      supabase.from('orders_count_last_30_days').select('count').single() // Assumes view exists
    ]);

    if (revenueData.error) throw new Error(`Analytics error - Revenue data: ${revenueData.error.message}`);
    if (inventoryData.error) throw new Error(`Analytics error - Inventory data: ${inventoryData.error.message}`);
    if (signupsData.error) throw new Error(`Analytics error - Signups data: ${signupsData.error.message}`);
    if (totalOrdersData.error) throw new Error(`Analytics error - Total orders data: ${totalOrdersData.error.message}`);
    if (activeUsersCountData.error) throw new Error(`Analytics error - Active users count: ${activeUsersCountData.error.message}. Ensure 'active_users_count_last_30_days' view exists.`);
    if (ordersLast30DaysCountData.error) throw new Error(`Analytics error - Orders last 30 days count: ${ordersLast30DaysCountData.error.message}. Ensure 'orders_count_last_30_days' view exists.`);

    const totalOrders = totalOrdersData.count || 0;
    const activeUsersCount = activeUsersCountData.data?.count || 0;
    const ordersLast30DaysCount = ordersLast30DaysCountData.data?.count || 0;

    let conversionRate = 0;
    if (activeUsersCount > 0) {
      conversionRate = (ordersLast30DaysCount / activeUsersCount) * 100;
    }
    console.log('API /api/admin/analytics: Successfully fetched and processed analytics data.');
    return NextResponse.json({
      revenue: revenueData.data,
      inventory: inventoryData.data,
      signups: signupsData.data,
      stats: {
        totalRevenue: revenueData.data?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0,
        totalOrders: totalOrders,
        activeUsers: activeUsersCount,
        conversionRate: parseFloat(conversionRate.toFixed(1)), 
      }
    });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while fetching admin analytics.';
    console.error('API /api/admin/analytics: General error in GET handler:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    
// -- Example SQL for Supabase Views (create these in your Supabase SQL editor) --

// -- revenue_over_time (Example: daily revenue for last 30 days from 'delivered' orders)
// CREATE OR REPLACE VIEW revenue_over_time AS
// SELECT
//   date_trunc('day', created_at)::date AS day,
//   SUM(total_amount) AS revenue
// FROM orders
// WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'
// GROUP BY 1
// ORDER BY 1;

// -- inventory_status (Example: count of products by category, and low stock items)
// CREATE OR REPLACE VIEW inventory_status AS
// SELECT
//   c.name AS category_name,
//   COUNT(p.id) AS product_count,
//   SUM(CASE WHEN p.stock < 10 THEN 1 ELSE 0 END) as low_stock_count
// FROM products p
// JOIN categories c ON p.category_id = c.id
// GROUP BY c.name;

// -- new_signups_over_time (Example: daily new user signups for last 30 days)
// CREATE OR REPLACE VIEW new_signups_over_time AS
// SELECT
//   date_trunc('day', created_at)::date AS day,
//   COUNT(id) AS signup_count
// FROM users -- Assuming 'users' is your profiles table linked to auth.users
// WHERE created_at >= NOW() - INTERVAL '30 days'
// GROUP BY 1
// ORDER BY 1;

// -- active_users_count_last_30_days (Example: count of users created in the last 30 days)
// CREATE OR REPLACE VIEW active_users_count_last_30_days AS
// SELECT COUNT(id) as count
// FROM users -- Assuming 'users' is your profiles table
// WHERE created_at >= NOW() - INTERVAL '30 days';

// -- orders_count_last_30_days (Example: count of orders placed in the last 30 days)
// CREATE OR REPLACE VIEW orders_count_last_30_days AS
// SELECT COUNT(id) as count
// FROM orders
// WHERE created_at >= NOW() - INTERVAL '30 days';
