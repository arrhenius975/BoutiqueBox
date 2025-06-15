
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
    const name = formData.get('name') as string | null;
    const avatarFile = formData.get('avatar') as File | null;

    const updatePayload: { name?: string; avatar_url?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    let newAvatarUrl: string | undefined = undefined;

    if (name && typeof name === 'string' && name.trim() !== '') {
      updatePayload.name = name.trim();
    }

    if (avatarFile) {
      if (avatarFile.size > 2 * 1024 * 1024) { // 2MB limit
        return NextResponse.json({ error: 'Avatar image too large (max 2MB).' }, { status: 413 });
      }

      const fileExtension = avatarFile.name.split('.').pop();
      const sanitizedFileName = `avatar-${Date.now()}.${fileExtension}`;
      const filePath = `profile-pictures/${authId}/${sanitizedFileName}`;

      // Fetch old avatar URL to delete it from storage if a new one is uploaded
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('auth_id', authId)
        .single();

      if (userFetchError) {
          console.warn('Could not fetch existing avatar URL for deletion:', userFetchError.message);
      } else if (userData?.avatar_url && userData.avatar_url.includes('profile-pictures/')) {
          // Attempt to delete old avatar from storage
          try {
            const oldAvatarPath = userData.avatar_url.substring(userData.avatar_url.indexOf('profile-pictures/'));
            const { error: deleteOldError } = await supabase.storage.from('profile-pictures').remove([oldAvatarPath]);
            if (deleteOldError) {
                console.warn('Failed to delete old avatar from storage:', deleteOldError.message);
            }
          } catch (e) {
            console.warn('Error parsing or deleting old avatar from storage:', e);
          }
      }


      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, avatarFile, {
          upsert: true, // Better to upsert if old file deletion fails or path is the same
          contentType: avatarFile.type,
        });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return NextResponse.json({ error: `Avatar upload failed: ${uploadError.message}` }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('Failed to get public URL for avatar:', filePath);
        // Product was still updated if name was provided, but avatar URL couldn't be retrieved.
        // Depending on strictness, you might return an error or a partial success.
        return NextResponse.json({ error: 'Failed to get public URL for new avatar.' }, { status: 500 });
      }
      newAvatarUrl = publicUrlData.publicUrl;
      updatePayload.avatar_url = newAvatarUrl;
    }
    
    // Only update if there's something to update (name or avatar)
    if (!updatePayload.name && !updatePayload.avatar_url) {
        return NextResponse.json({ success: true, message: "No changes to update.", avatarUrl: undefined });
    }


    const { error: updateUserError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('auth_id', authId);

    if (updateUserError) {
      console.error('Error updating user profile:', updateUserError);
      return NextResponse.json({ error: `Failed to update profile: ${updateUserError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatarUrl: newAvatarUrl, name: updatePayload.name });

  } catch (e: unknown) {
    console.error('PUT /api/profile general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    
