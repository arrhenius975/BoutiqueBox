
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

  console.log("API /api/categories: POST request received.");

  if (!await isAdmin(supabase)) {
    console.warn("API /api/categories: Admin check failed. Forbidden access.");
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }
  console.log("API /api/categories: Admin authenticated.");

  try {
    const body = await req.json();
    const { name, description } = body;
    console.log("API /api/categories: Received payload:", { name, description });

    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.warn("API /api/categories: Validation failed - Category name is required.");
      return NextResponse.json({ error: 'Category name is required and must be a non-empty string.' }, { status: 400 });
    }

    const insertPayload = { 
      name: name.trim(), 
      description: description?.trim() || null 
    };
    console.log("API /api/categories: Attempting to insert category with payload:", insertPayload);

    const { data, error } = await supabase
      .from('categories')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error('API /api/categories: Error creating category in Supabase:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: `Category name '${name.trim()}' already exists.` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create category.' }, { status: 500 });
    }

    console.log("API /api/categories: Category created successfully:", data);
    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    console.error('API /api/categories: General error in POST handler:', errorMessage, e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  console.log("API /api/categories: GET request received.");
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description') 
      .order('name', { ascending: true });

    if (error) {
      console.error('API /api/categories: Error fetching categories in Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log(`API /api/categories: Fetched ${data?.length || 0} categories successfully.`);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    console.error('API /api/categories: General error in GET handler:', errorMessage, e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    