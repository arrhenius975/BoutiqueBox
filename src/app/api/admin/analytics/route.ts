
// src/app/api/admin/analytics/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// IMPORTANT: You need to create these PostgreSQL functions/views in your Supabase project.
// Example SQL for these views/functions can be found in comments below or on the Admin Dashboard page.

export async function GET(req: NextRequest) {
  const cookieStore = await cookies(); 
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

    const fetchDataWithFallback = async (queryPromise: Promise<{ data: any; error: any; count?: number | null }>, fallbackValue: any = [], metricName: string = "Unknown Metric") => {
      try {
        const { data, error, count } = await queryPromise;
        if (error) {
          console.warn(`Analytics API: Error fetching ${metricName} - ${error.message}. View might be missing or misconfigured. Returning default.`);
          // Log the specific error for server-side diagnosis
          return { data: fallbackValue, error: null, count: typeof fallbackValue === 'number' ? fallbackValue : (fallbackValue?.count !== undefined ? fallbackValue.count : null) };
        }
        return { data, error, count };
      } catch (e: any) {
        console.error(`Analytics API: General error during ${metricName} fetch - ${e.message}. Returning default.`);
        return { data: fallbackValue, error: e, count: typeof fallbackValue === 'number' ? fallbackValue : (fallbackValue?.count !== undefined ? fallbackValue.count : null) };
      }
    };

    const revenueResult = await fetchDataWithFallback(supabase.from('revenue_over_time').select('*'), [], 'Revenue Over Time');
    const inventoryResult = await fetchDataWithFallback(supabase.from('inventory_status').select('*'), [], 'Inventory Status');
    const signupsResult = await fetchDataWithFallback(supabase.from('new_signups_over_time').select('*'), [], 'New Signups Over Time');
    
    const totalOrdersResult = await fetchDataWithFallback(
      supabase.from('orders').select('id', { count: 'exact', head: true }), 
      { count: 0 }, // Fallback for count
      'Total Orders'
    );
    const activeUsersCountResult = await fetchDataWithFallback(
      supabase.from('active_users_count_last_30_days').select('count').single(),
      { data: { count: 0 } }, // Fallback for single object with count
      'Active Users Count'
    );
    const ordersLast30DaysCountResult = await fetchDataWithFallback(
      supabase.from('orders_count_last_30_days').select('count').single(),
      { data: { count: 0 } }, // Fallback for single object with count
      'Orders Last 30 Days Count'
    );

    const revenueData = revenueResult.data || [];
    const inventoryData = inventoryResult.data || [];
    const signupsData = signupsResult.data || [];
    
    const totalOrders = totalOrdersResult.count || 0;
    const activeUsersCount = activeUsersCountResult.data?.count || 0;
    const ordersLast30DaysCount = ordersLast30DaysCountResult.data?.count || 0;

    let conversionRate = 0;
    if (activeUsersCount > 0) {
      conversionRate = (ordersLast30DaysCount / activeUsersCount) * 100;
    }
    
    console.log('API /api/admin/analytics: Successfully fetched and processed analytics data (with fallbacks if needed).');
    return NextResponse.json({
      revenue: revenueData,
      inventory: inventoryData,
      signups: signupsData,
      stats: {
        totalRevenue: revenueData.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0) || 0,
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

    
