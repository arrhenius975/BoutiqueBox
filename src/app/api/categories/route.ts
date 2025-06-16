
// src/app/api/categories/route.ts
import { supabase } from '@/data/supabase'; // Reverted to global client
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to check admin role
async function isAdmin(): Promise<boolean> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return false;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
  
  return !profileError && profile?.role === 'admin';
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) {
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
  // GETting categories is public, no admin check needed here.
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
