
// src/app/api/admin/analytics/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// IMPORTANT: You need to create these PostgreSQL functions/views in your Supabase project.
// Example SQL for these views/functions:

// -- revenue_over_time (Example: daily revenue for last 30 days)
// CREATE OR REPLACE VIEW revenue_over_time AS
// SELECT
//   date_trunc('day', created_at)::date AS day,
//   SUM(total_amount) AS revenue
// FROM orders
// WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'
// GROUP BY 1
// ORDER BY 1;

// -- inventory_status (Example: count of products by category, or low stock items)
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
// FROM users -- or your profiles table if user creation is tracked there
// WHERE created_at >= NOW() - INTERVAL '30 days'
// GROUP BY 1
// ORDER BY 1;

// -- Suggested View for active_users_count_last_30_days
// CREATE OR REPLACE VIEW active_users_count_last_30_days AS
// SELECT COUNT(id) as count
// FROM users
// WHERE created_at >= NOW() - INTERVAL '30 days';

// -- Suggested View for orders_count_last_30_days
// CREATE OR REPLACE VIEW orders_count_last_30_days AS
// SELECT COUNT(id) as count
// FROM orders
// WHERE created_at >= NOW() - INTERVAL '30 days';


export async function GET(req: NextRequest) {
  try {
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();
    
    if (profileError || !profile) return NextResponse.json({ error: 'Could not fetch user profile or profile not found.' }, { status: 403 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });

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

    if (revenueData.error) throw new Error(`Revenue data error: ${revenueData.error.message}`);
    if (inventoryData.error) throw new Error(`Inventory data error: ${inventoryData.error.message}`);
    if (signupsData.error) throw new Error(`Signups data error: ${signupsData.error.message}`);
    if (totalOrdersData.error) throw new Error(`Total orders data error: ${totalOrdersData.error.message}`);
    if (activeUsersCountData.error) throw new Error(`Active users count error: ${activeUsersCountData.error.message}. Ensure 'active_users_count_last_30_days' view exists.`);
    if (ordersLast30DaysCountData.error) throw new Error(`Orders last 30 days count error: ${ordersLast30DaysCountData.error.message}. Ensure 'orders_count_last_30_days' view exists.`);

    const totalOrders = totalOrdersData.count || 0;
    const activeUsersCount = activeUsersCountData.data?.count || 0;
    const ordersLast30DaysCount = ordersLast30DaysCountData.data?.count || 0;

    let conversionRate = 0;
    if (activeUsersCount > 0) {
      conversionRate = (ordersLast30DaysCount / activeUsersCount) * 100;
    }

    return NextResponse.json({
      revenue: revenueData.data,
      inventory: inventoryData.data,
      signups: signupsData.data,
      stats: {
        totalRevenue: revenueData.data?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0,
        totalOrders: totalOrders,
        activeUsers: activeUsersCount,
        conversionRate: parseFloat(conversionRate.toFixed(1)), // Keep one decimal place
      }
    });

  } catch (e: unknown) {
    console.error('GET /api/admin/analytics general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    
