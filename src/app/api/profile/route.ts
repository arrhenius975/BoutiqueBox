
// src/app/api/profile/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const authId = user.id;

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No avatar file provided' }, { status: 400 });
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        return NextResponse.json({ error: 'Avatar image too large (max 2MB).' }, { status: 413 });
    }

    const fileExtension = file.name.split('.').pop();
    const sanitizedFileName = `avatar-${Date.now()}.${fileExtension}`;
    const filePath = `profile-pictures/${authId}/${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures') // Ensure this bucket exists and has RLS policies
      .upload(filePath, file, {
        upsert: true, // Overwrite if file exists
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json({ error: `Avatar upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('Failed to get public URL for avatar:', filePath);
      return NextResponse.json({ error: 'Failed to get public URL for avatar.' }, { status: 500 });
    }
    const avatarUrl = publicUrlData.publicUrl;

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('auth_id', authId);

    if (updateUserError) {
      console.error('Error updating user profile with avatar URL:', updateUserError);
      return NextResponse.json({ error: `Failed to update profile: ${updateUserError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatarUrl });

  } catch (e: unknown) {
    console.error('PUT /api/profile general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    