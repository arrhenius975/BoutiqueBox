// src/app/api/admin/analytics/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { format } from 'date-fns';

interface RevenueDataPoint {
  day: string;
  revenue: number;
}
interface SignupDataPoint {
  day: string;
  signup_count: number;
}
interface InventoryStatus {
  category_name: string;
  product_count: number;
  low_stock_count: number;
}

interface ChartRevenueData {
  name: string;
  revenue: number;
}
interface ChartSignupData {
  name: string;
  signups: number;
}

interface DashboardStats {
  totalRevenueLast30Days: number;
  totalOrdersAllTime: number;
  activeUsersLast30Days: number;
  conversionRateLast30Days: number;
  ordersLast30Days: number; // Added for more precise AOV calculation
}

interface AnalyticsApiResponse {
  revenue: ChartRevenueData[];
  inventory: InventoryStatus[];
  signups: ChartSignupData[];
  stats: DashboardStats;
}

export async function GET(req: NextRequest) {
  console.log(`API /api/admin/analytics: Received GET request for path ${req.nextUrl.pathname}`);
  const cookieStore = await cookies();

  if (cookieStore.getAll().length > 0) {
    console.log('API /api/admin/analytics: Cookie store is NOT empty. Cookies are being received by the route handler.');
  } else {
    console.warn('API /api/admin/analytics: Cookie store IS EMPTY. This is the primary reason for auth issues if it happens consistently.');
  }

  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  console.log('API /api/admin/analytics: Attempting to get user session via supabase.auth.getUser().');
  try {
    const { data: { user: authApiUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('API /api/admin/analytics: Auth error from supabase.auth.getUser():', authError.message);
      return NextResponse.json({ error: `Auth service error: ${authError.message}` }, { status: 500 });
    }

    if (!authApiUser) {
      console.warn('API /api/admin/analytics: No authenticated user found (authApiUser is null/undefined after getUser). This implies no valid session based on cookies.');
      return NextResponse.json({ error: 'User not authenticated. No session found by Supabase client in API route.' }, { status: 401 });
    }
    console.log(`API /api/admin/analytics: Authenticated user identified: ${authApiUser.email} (Auth ID: ${authApiUser.id})`);

    console.log(`API /api/admin/analytics: Fetching profile for auth_id ${authApiUser.id} to check admin role.`);
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
        console.warn(`API /api/admin/analytics: Profile not found for auth_id ${authApiUser.id}. Cannot verify admin role.`);
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    console.log(`API /api/admin/analytics: Profile role for ${authApiUser.email}: ${profile.role}`);

    if (profile.role !== 'admin') {
      console.warn(`API /api/admin/analytics: User ${authApiUser.email} (Auth ID: ${authApiUser.id}) is NOT an admin. Role: ${profile.role}. Access denied.`);
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }
    console.log(`API /api/admin/analytics: User ${authApiUser.email} confirmed as admin. Proceeding to fetch analytics data.`);

    const fetchDataWithFallback = async (queryPromise: Promise<{ data: any; error: any; count?: number | null }>, fallbackValue: any = [], metricName: string = "Unknown Metric") => {
      try {
        const { data, error, count } = await queryPromise;
        if (error) {
          console.warn(`API /api/admin/analytics: Error fetching ${metricName} - ${error.message}. View might be missing or misconfigured. Returning default.`);
          return { data: fallbackValue, error: null, count: typeof fallbackValue === 'number' ? fallbackValue : (fallbackValue?.count !== undefined ? fallbackValue.count : null) };
        }
        console.log(`API /api/admin/analytics: Successfully fetched ${metricName}. Count: ${count}, Data items: ${Array.isArray(data) ? data.length : (data ? 1 : 0)}`);
        return { data, error, count };
      } catch (e: any) {
        console.error(`API /api/admin/analytics: General error during ${metricName} fetch - ${e.message}. Returning default.`);
        return { data: fallbackValue, error: e, count: typeof fallbackValue === 'number' ? fallbackValue : (fallbackValue?.count !== undefined ? fallbackValue.count : null) };
      }
    };

    const revenueResult = await fetchDataWithFallback(supabase.from('revenue_over_time').select('*'), [], 'Revenue Over Time');
    const inventoryResult = await fetchDataWithFallback(supabase.from('inventory_status').select('*'), [], 'Inventory Status');
    const signupsResult = await fetchDataWithFallback(supabase.from('new_signups_over_time').select('*'), [], 'New Signups Over Time');
    
    const totalOrdersAllResult = await fetchDataWithFallback(
      supabase.from('orders').select('id', { count: 'exact', head: true }), 
      { count: 0 }, 
      'Total Orders Count (All Time)'
    );
    const activeUsersCountResult = await fetchDataWithFallback(
      supabase.from('active_users_count_last_30_days').select('count').single(),
      { data: { count: 0 } }, 
      'Active Users Count (Last 30 Days)'
    );
    const ordersLast30DaysCountResult = await fetchDataWithFallback(
      supabase.from('orders_count_last_30_days').select('count').single(),
      { data: { count: 0 } },
      'Orders Count (Last 30 Days)'
    );

    const rawRevenueData = revenueResult.data || [];
    const inventoryData = inventoryResult.data || [];
    const rawSignupsData = signupsResult.data || [];
    
    const totalOrdersAllTime = totalOrdersAllResult.count || 0;
    const activeUsersLast30Days = activeUsersCountResult.data?.count || 0;
    const ordersLast30Days = ordersLast30DaysCountResult.data?.count || 0;

    let conversionRateLast30Days = 0;
    if (activeUsersLast30Days > 0 && ordersLast30Days > 0) {
      conversionRateLast30Days = (ordersLast30Days / activeUsersLast30Days) * 100;
    }
    
    const processedRevenueData: ChartRevenueData[] = (rawRevenueData as RevenueDataPoint[]).map(item => ({
        name: format(new Date(item.day), 'MMM dd'),
        revenue: item.revenue || 0,
    })).slice(-30);

    const processedSignupData: ChartSignupData[] = (rawSignupsData as SignupDataPoint[]).map(item => ({
        name: format(new Date(item.day), 'MMM dd'),
        signups: item.signup_count || 0,
    })).slice(-30);

    const totalRevenueLast30Days = processedRevenueData.reduce((sum: number, item: ChartRevenueData) => sum + (item.revenue || 0), 0);

    console.log('API /api/admin/analytics: Successfully fetched and processed all analytics data (with fallbacks if needed).');
    return NextResponse.json({
      revenue: processedRevenueData,
      inventory: inventoryData,
      signups: processedSignupData,
      stats: {
        totalRevenueLast30Days: totalRevenueLast30Days,
        totalOrdersAllTime: totalOrdersAllTime,
        activeUsersLast30Days: activeUsersLast30Days,
        conversionRateLast30Days: parseFloat(conversionRateLast30Days.toFixed(1)), 
        ordersLast30Days: ordersLast30Days, // Include this for AOV
      }
    } as AnalyticsApiResponse);

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while fetching admin analytics.';
    console.error('API /api/admin/analytics: General error in GET handler:', errorMessage, e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// -- Example SQL for Supabase Views (Create these in your Supabase SQL Editor) --
// -- Remember to replace 'public.users' with your actual profiles table name if different.
// -- Using 'SECURITY DEFINER' is often necessary for these views to access underlying tables.

// -- revenue_over_time: Daily revenue from 'delivered' or 'paid' orders in the last 30 days.
// CREATE OR REPLACE VIEW public.revenue_over_time
// WITH (security_definer = true)
// AS
// SELECT
//   date_trunc('day', o.created_at)::date AS day,
//   SUM(o.total_amount) AS revenue
// FROM public.orders o
// WHERE o.status IN ('delivered', 'paid') AND o.created_at >= (NOW() - INTERVAL '30 days')
// GROUP BY 1
// ORDER BY 1;

// -- inventory_status: Product counts per category and low stock items.
// CREATE OR REPLACE VIEW public.inventory_status
// WITH (security_definer = true)
// AS
// SELECT
//   c.name AS category_name,
//   COUNT(p.id) AS product_count,
//   SUM(CASE WHEN p.stock < 10 THEN 1 ELSE 0 END) as low_stock_count
// FROM public.products p
// JOIN public.categories c ON p.category_id = c.id
// GROUP BY c.name;

// -- new_signups_over_time: Daily new user signups from the 'users' table (profiles table) for last 30 days.
// -- Assumes your public profiles table is named 'users' and has a 'created_at' column.
// CREATE OR REPLACE VIEW public.new_signups_over_time
// WITH (security_definer = true)
// AS
// SELECT
//   date_trunc('day', u.created_at)::date AS day,
//   COUNT(u.id) AS signup_count
// FROM public.users u -- Ensure 'users' is your profiles table linked to auth.users
// WHERE u.created_at >= (NOW() - INTERVAL '30 days')
// GROUP BY 1
// ORDER BY 1;

// -- active_users_count_last_30_days: Count of users (profiles) created in the last 30 days.
// -- Assumes your public profiles table is named 'users' and has a 'created_at' column.
// CREATE OR REPLACE VIEW public.active_users_count_last_30_days
// WITH (security_definer = true)
// AS
// SELECT COUNT(u.id) as count
// FROM public.users u -- Ensure 'users' is your profiles table
// WHERE u.created_at >= (NOW() - INTERVAL '30 days');

// -- orders_count_last_30_days: Count of orders placed in the last 30 days.
// -- Assumes your orders table is named 'orders' and has a 'created_at' column.
// CREATE OR REPLACE VIEW public.orders_count_last_30_days
// WITH (security_definer = true)
// AS
// SELECT COUNT(o.id) as count
// FROM public.orders o
// WHERE o.created_at >= (NOW() - INTERVAL '30 days');
