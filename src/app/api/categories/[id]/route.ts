
// src/app/api/categories/[id]/route.ts
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (!await isAdmin(supabase)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { id } = params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID.' }, { status: 400 });
    }

    const { name, description } = await req.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }
    
    const { data: existingCategory, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', categoryId)
        .single();

    if (fetchError || !existingCategory) {
        return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    const updatePayload = { name: name.trim(), description: description?.trim() || null };

    const { data, error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { 
        return NextResponse.json({ error: `Category name '${name.trim()}' already exists.` }, { status: 409 });
      }
      console.error(`Error updating category ${categoryId}:`, error);
      return NextResponse.json({ error: error.message || 'Failed to update category.' }, { status: 500 });
    }
    
    if (!data) {
        return NextResponse.json({ error: 'Category not found after update attempt.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (e: unknown) {
    console.error('PUT /api/categories/[id] general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (!await isAdmin(supabase)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { id } = params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID.' }, { status: 400 });
    }
    
    const { data: existingCategory, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', categoryId)
        .single();

    if (fetchError || !existingCategory) {
        return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      if (error.code === '23503') { 
        return NextResponse.json({ error: 'Cannot delete category: It is currently associated with existing products. Please reassign or delete these products first.' }, { status: 409 });
      }
      console.error(`Error deleting category ${categoryId}:`, error);
      return NextResponse.json({ error: error.message || 'Failed to delete category.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Category deleted successfully.' });
  } catch (e: unknown) {
    console.error('DELETE /api/categories/[id] general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
