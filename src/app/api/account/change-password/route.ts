// src/app/api/account/change-password/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated. Please log in again.' }, { status: 401 });
    }

    const { newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating user password:', updateError);
      return NextResponse.json({ error: `Failed to update password: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });

  } catch (e: unknown) {
    console.error('POST /api/account/change-password general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during password change.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
