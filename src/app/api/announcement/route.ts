
// src/app/api/announcement/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { AnnouncementSetting } from '@/types';

const ANNOUNCEMENT_KEY = 'announcement_banner';
const DEFAULT_ANNOUNCEMENT_SETTING: AnnouncementSetting = {
  message: '',
  enabled: false,
};

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value') // Select only the 'value' column which contains the JSONB
      .eq('key', ANNOUNCEMENT_KEY)
      .maybeSingle();

    if (error) {
      console.error('Error fetching announcement setting:', error);
      // If the table or setting doesn't exist, it's not a critical error for the public API;
      // just return the default (disabled) setting.
      // A specific error for table not existing (42P01 for PostgreSQL) can be logged here if needed.
      return NextResponse.json({ announcement_banner: DEFAULT_ANNOUNCEMENT_SETTING });
    }

    if (!data || !data.value) {
      // No setting found, return a default.
      return NextResponse.json({ announcement_banner: DEFAULT_ANNOUNCEMENT_SETTING });
    }

    // The 'value' column directly contains the AnnouncementSetting object.
    return NextResponse.json({ announcement_banner: data.value as AnnouncementSetting });

  } catch (e: unknown) {
    console.error('GET /api/announcement general error:', e);
    // Fallback to default in case of any unexpected errors
    return NextResponse.json({ announcement_banner: DEFAULT_ANNOUNCEMENT_SETTING });
  }
}
