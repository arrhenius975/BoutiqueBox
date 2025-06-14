
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
// -- Alternatively, for a list of low stock products:
// -- CREATE OR REPLACE VIEW low_stock_products AS
// -- SELECT id, name, stock FROM products WHERE stock < 10 ORDER BY stock ASC;


// -- new_signups (Example: daily new user signups for last 30 days)
// -- This assumes your 'users' table has a 'created_at' timestamp when profile is created.
// CREATE OR REPLACE VIEW new_signups_over_time AS
// SELECT
//   date_trunc('day', created_at)::date AS day,
//   COUNT(id) AS signup_count
// FROM users -- or your profiles table if user creation is tracked there
// WHERE created_at >= NOW() - INTERVAL '30 days'
// GROUP BY 1
// ORDER BY 1;

export async function GET(req: NextRequest) {
  try {
    // Ensure the user making this request is an admin.
    // You would typically implement auth checks here, e.g., using Supabase Auth with RLS or custom middleware.
    // For brevity, this example omits explicit auth checks.

    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Fetch user profile to check role
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();
    
    if (profileError || !profile) return NextResponse.json({ error: 'Could not fetch user profile or profile not found.' }, { status: 403 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });


    // Call the RPC functions or select from views
    const [revenueData, inventoryData, signupsData] = await Promise.all([
      supabase.from('revenue_over_time').select('*'), // Assuming 'revenue_over_time' is a VIEW
      supabase.from('inventory_status').select('*'),    // Assuming 'inventory_status' is a VIEW
      supabase.from('new_signups_over_time').select('*')     // Assuming 'new_signups_over_time' is a VIEW
    ]);

    if (revenueData.error) throw new Error(`Revenue data error: ${revenueData.error.message}`);
    if (inventoryData.error) throw new Error(`Inventory data error: ${inventoryData.error.message}`);
    if (signupsData.error) throw new Error(`Signups data error: ${signupsData.error.message}`);

    return NextResponse.json({
      revenue: revenueData.data,
      inventory: inventoryData.data,
      signups: signupsData.data,
    });

  } catch (e: unknown) {
    console.error('GET /api/admin/analytics general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    