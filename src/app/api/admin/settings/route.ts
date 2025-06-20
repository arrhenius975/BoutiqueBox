
// src/app/api/admin/settings/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { AnnouncementSetting } from '@/types';

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

const ANNOUNCEMENT_KEY = 'announcement_banner';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const adminCheck = await isAdmin(supabase);
  if (!adminCheck.isAdmin && adminCheck.errorResponse) {
    return adminCheck.errorResponse;
  }
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('key', ANNOUNCEMENT_KEY)
      .maybeSingle(); 

    if (error) {
      console.error('Error fetching app settings:', error);
      if (error.code === '42P01') {
         return NextResponse.json({ error: "The 'app_settings' table does not exist. Please create it in your database.", 
                                     hint: "Table structure: key TEXT PRIMARY KEY, value JSONB, updated_at TIMESTAMPTZ DEFAULT NOW()" }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to fetch app settings.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ [ANNOUNCEMENT_KEY]: { message: '', enabled: false } }, { status: 200 });
    }

    return NextResponse.json({ [data.key]: data.value as AnnouncementSetting });

  } catch (e: unknown) {
    console.error('GET /api/admin/settings general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const adminCheck = await isAdmin(supabase);
  if (!adminCheck.isAdmin && adminCheck.errorResponse) {
    return adminCheck.errorResponse;
  }
   if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const announcementSetting = body.announcement_banner as AnnouncementSetting | undefined;

    if (!announcementSetting || typeof announcementSetting.message !== 'string' || typeof announcementSetting.enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid announcement_banner data provided.' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(
        { key: ANNOUNCEMENT_KEY, value: announcementSetting, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving app settings:', error);
      if (error.code === '42P01') { 
         return NextResponse.json({ error: "The 'app_settings' table does not exist. Please create it.", 
                                     hint: "Table structure: key TEXT PRIMARY KEY, value JSONB, updated_at TIMESTAMPTZ DEFAULT NOW()" }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to save app settings.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, setting: data });
  } catch (e: unknown) {
    console.error('POST /api/admin/settings general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
