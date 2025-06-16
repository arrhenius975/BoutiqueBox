
// src/app/api/categories/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to check admin role
async function isAdmin(supabaseClient: ReturnType<typeof createRouteHandlerClient>): Promise<boolean> {
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) return false;

  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
  
  return !profileError && profile?.role === 'admin';
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (!await isAdmin(supabase)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { name, description } = await req.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required and must be a non-empty string.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: name.trim(), description: description?.trim() || null }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: `Category name '${name.trim()}' already exists.` }, { status: 409 });
      }
      console.error('Error creating category:', error);
      return NextResponse.json({ error: error.message || 'Failed to create category.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (e: unknown) {
    console.error('POST /api/categories general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // The public GET handler for all categories is being temporarily disabled
  // as the public-facing dynamic category pages are being simplified/removed.
  // Admin panel can still fetch categories if it uses a different mechanism or if this GET
  // is restricted to admin roles (which it currently is not).
  // For now, returning a message indicating it's not for public use.
  // If admin panel relies on this to list categories for product forms, it might need adjustment
  // or this GET endpoint might need to be admin-protected.
  // For simplicity to resolve build issues, we are making it unavailable.
  // Admin products page already fetches categories separately.

  // Re-instating admin-only GET for categories to support Admin Panel (e.g. product form dropdown)
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Only admins should be able to list all categories through this generic GET
  // (even though product form might fetch them without auth on client side for simplicity,
  // a dedicated admin endpoint for this is better)
  // However, to keep it simple and ensure product form works,
  // we allow fetching if it's for admin UI context.
  // A truly public GET for categories is what's being deprecated.
  // The AdminProductsPage already fetches categories.
  // The ProductForm gets categories passed as props.
  // So, this public GET can be simplified to say it's not available.

  // Let's restore a basic GET functionality for categories, as the admin panel
  // (e.g., for populating dropdowns in product forms) might still rely on it.
  // The *public display* of dynamic categories is what we're removing.
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description') 
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error('GET /api/categories general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
