
// src/app/api/admin/users/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SupabaseUser } from '@/types';

// Helper to check admin role
async function isAdmin(supabaseClient: ReturnType<typeof createRouteHandlerClient>): Promise<{ isAdmin: boolean; errorResponse?: NextResponse }> {
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
  
  if (profileError || !profile) {
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Could not fetch user profile.' }, { status: 500 }) };
  }
  if (profile.role !== 'admin') {
    return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 }) };
  }
  return { isAdmin: true };
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const adminCheck = await isAdmin(supabase);
  if (!adminCheck.isAdmin && adminCheck.errorResponse) {
    return adminCheck.errorResponse;
  }
   if (!adminCheck.isAdmin) { // Fallback
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, auth_id, email, name, avatar_url, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch users.' }, { status: 500 });
    }

    return NextResponse.json(data as SupabaseUser[]);
  } catch (e: unknown) {
    console.error('GET /api/admin/users general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
