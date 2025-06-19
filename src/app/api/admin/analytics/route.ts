
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
  name: string; // Formatted date string e.g., "May 14"
  revenue: number;
}
interface ChartSignupData {
  name: string; // Formatted date string e.g., "May 14"
  signups: number;
}

interface DashboardStats {
  totalRevenueLast30Days: number;
  totalOrdersAllTime: number; 
  activeUsersLast30Days: number;
  conversionRateLast30Days: number;
  ordersLast30Days: number; // This is key for 30-day AOV
}

interface AnalyticsApiResponse {
  revenue: ChartRevenueData[];
  inventory: InventoryStatus[]; // Define more strictly if used
  signups: ChartSignupData[];
  stats: DashboardStats;
}

export async function GET(req: NextRequest) {
  const currentPath = req.nextUrl.pathname;
  console.log(`API ${currentPath}: Received GET request.`);
  const cookieStore = cookies();

  if (cookieStore.getAll().length > 0) {
    console.log(`API ${currentPath}: Cookie store is NOT empty. Cookies are being received.`);
  } else {
    console.warn(`API ${currentPath}: Cookie store IS EMPTY. This is a critical issue if consistent.`);
  }

  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  console.log(`API ${currentPath}: Attempting to get user session via supabase.auth.getUser().`);
  try {
    const { data: { user: authApiUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error(`API ${currentPath}: Auth error from supabase.auth.getUser():`, authError.message);
      return NextResponse.json({ error: `Auth service error (getUser): ${authError.message}` }, { status: 500 });
    }

    if (!authApiUser) {
      console.warn(`API ${currentPath}: No authenticated user found by supabase.auth.getUser(). This implies no valid session based on cookies passed to the route handler.`);
      return NextResponse.json({ error: 'User not authenticated. No session found by Supabase client in API route.' }, { status: 401 });
    }
    console.log(`API ${currentPath}: Authenticated user identified by getUser: ${authApiUser.email} (Auth ID: ${authApiUser.id})`);

    // Re-verify session using getSession for good measure and explicit token check if needed elsewhere
    const { data: { session: currentSession }, error: getSessionError } = await supabase.auth.getSession();
    if (getSessionError) {
      console.error(`API ${currentPath}: Error from supabase.auth.getSession():`, getSessionError.message);
      return NextResponse.json({ error: `Auth service error (getSession): ${getSessionError.message}` }, { status: 500 });
    }
    if (!currentSession) {
      console.warn(`API ${currentPath}: No session from supabase.auth.getSession(), though getUser returned a user. This is inconsistent.`);
      return NextResponse.json({ error: 'User session inconsistency.' }, { status: 401 });
    }
    console.log(`API ${currentPath}: Session confirmed by getSession for user: ${currentSession.user.email}. Access token exists: ${!!currentSession.access_token}`);


    console.log(`API ${currentPath}: Fetching profile for auth_id ${authApiUser.id} to check admin role.`);
    const { data: profile, error: profileError } = await supabase
        .from('users') // Ensure this is 'users', not 'profiles'
        .select('role')
        .eq('auth_id', authApiUser.id) // Ensure this matches your public.users table schema
        .single();
    
    if (profileError) {
      console.error(`API ${currentPath}: Error fetching profile for auth_id ${authApiUser.id}:`, profileError);
      return NextResponse.json({ error: `Could not fetch user profile: ${profileError.message}` }, { status: 500 });
    }
    if (!profile) {
        console.warn(`API ${currentPath}: Profile not found for auth_id ${authApiUser.id}. Cannot verify admin role.`);
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    console.log(`API ${currentPath}: Profile role for ${authApiUser.email}: ${profile.role}`);

    if (profile.role !== 'admin') {
      console.warn(`API ${currentPath}: User ${authApiUser.email} (Auth ID: ${authApiUser.id}) is NOT an admin. Role: ${profile.role}. Access denied.`);
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }
    console.log(`API ${currentPath}: User ${authApiUser.email} confirmed as admin. Proceeding to fetch analytics data.`);

    const fetchDataWithFallback = async (queryPromise: Promise<{ data: any; error: any; count?: number | null }>, fallbackValue: any = [], metricName: string = "Unknown Metric") => {
      try {
        const { data, error, count } = await queryPromise;
        if (error) {
          console.warn(`API ${currentPath}: Error fetching ${metricName} - ${error.message}. View might be missing or misconfigured. Returning default.`);
          return { data: fallbackValue, error: null, count: typeof fallbackValue === 'number' ? fallbackValue : (fallbackValue?.count !== undefined ? fallbackValue.count : null) };
        }
        console.log(`API ${currentPath}: Successfully fetched ${metricName}. Count: ${count}, Data items: ${Array.isArray(data) ? data.length : (data ? 1 : 0)}`);
        return { data, error, count };
      } catch (e: any) {
        console.error(`API ${currentPath}: General error during ${metricName} fetch - ${e.message}. Returning default.`);
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

    console.log(`API ${currentPath}: Successfully fetched and processed all analytics data (with fallbacks if needed).`);
    return NextResponse.json({
      revenue: processedRevenueData,
      inventory: inventoryData,
      signups: processedSignupData,
      stats: {
        totalRevenueLast30Days: totalRevenueLast30Days,
        totalOrdersAllTime: totalOrdersAllTime,
        activeUsersLast30Days: activeUsersLast30Days,
        conversionRateLast30Days: parseFloat(conversionRateLast30Days.toFixed(1)), 
        ordersLast30Days: ordersLast30Days,
      }
    } as AnalyticsApiResponse);

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while fetching admin analytics.';
    console.error(`API ${currentPath}: General error in GET handler:`, errorMessage, e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// -- Example SQL for Supabase Views (Create these in your Supabase SQL Editor) --
// -- Remember to replace 'public.users' with your actual profiles table name if different.
// -- Using 'WITH (security_definer = true)' is often necessary for these views to access underlying tables securely.

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
// GRANT SELECT ON public.revenue_over_time TO authenticated; -- Or your specific API user role

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
// GRANT SELECT ON public.inventory_status TO authenticated;

// -- new_signups_over_time: Daily new user signups from the 'users' table (profiles table) for last 30 days.
// -- Assumes your public profiles table is named 'users' and has a 'created_at' column and 'auth_id' linking to auth.users.
// CREATE OR REPLACE VIEW public.new_signups_over_time
// WITH (security_definer = true)
// AS
// SELECT
//   date_trunc('day', u.created_at)::date AS day,
//   COUNT(u.id) AS signup_count
// FROM public.users u
// WHERE u.created_at >= (NOW() - INTERVAL '30 days')
// GROUP BY 1
// ORDER BY 1;
// GRANT SELECT ON public.new_signups_over_time TO authenticated;

// -- active_users_count_last_30_days: Count of users (profiles) created in the last 30 days.
// CREATE OR REPLACE VIEW public.active_users_count_last_30_days
// WITH (security_definer = true)
// AS
// SELECT COUNT(u.id) as count
// FROM public.users u
// WHERE u.created_at >= (NOW() - INTERVAL '30 days');
// GRANT SELECT ON public.active_users_count_last_30_days TO authenticated;

// -- orders_count_last_30_days: Count of orders placed in the last 30 days.
// CREATE OR REPLACE VIEW public.orders_count_last_30_days
// WITH (security_definer = true)
// AS
// SELECT COUNT(o.id) as count
// FROM public.orders o
// WHERE o.created_at >= (NOW() - INTERVAL '30 days');
// GRANT SELECT ON public.orders_count_last_30_days TO authenticated;

    
