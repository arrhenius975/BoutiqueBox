
// src/app/api/account/delete/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'User not authenticated. Please log in again.' }, { status: 401 });
    }
    const authId = authUser.id;

    // 1. Fetch user's profile details from public.users to get avatar_url and the user's UUID (profile_id)
    const { data: userProfile, error: profileFetchError } = await supabase
      .from('users')
      .select('id, avatar_url') // 'id' here is the primary key of public.users
      .eq('auth_id', authId)
      .single();

    if (profileFetchError) {
      if (profileFetchError.code === 'PGRST116') { // Resource not found (user profile already deleted or never existed)
         return NextResponse.json({ success: true, message: "User profile not found or already cleared. No further action taken on profile data." });
      }
      console.error('Error fetching user profile for deletion:', profileFetchError);
      return NextResponse.json({ error: 'Could not retrieve user profile to delete data.' }, { status: 500 });
    }
    
    const profileId = userProfile.id; // The UUID from public.users table
    const avatarUrl = userProfile.avatar_url;

    // 2. Delete avatar from storage if it exists and is not a placeholder
    if (avatarUrl && !avatarUrl.startsWith('https://placehold.co')) {
      try {
        const url = new URL(avatarUrl);
        // Assuming bucket name is 'profile-pictures' and path is 'profile-pictures/<auth_id>/<filename>'
        const pathSegments = url.pathname.split('/');
        if (pathSegments.length > 3 && pathSegments[pathSegments.length - 3] === 'profile-pictures') { // Bucket is third from last
          const filePath = pathSegments.slice(pathSegments.length - 2).join('/'); //  <auth_id>/<filename>
          const bucketName = pathSegments[pathSegments.length - 3]; // profile-pictures

          if (bucketName === 'profile-pictures' && filePath) {
            const { error: storageDeleteError } = await supabase.storage
                .from(bucketName)
                .remove([filePath]);
            if (storageDeleteError) {
                console.warn(`Failed to delete avatar from storage for user ${authId} at path ${filePath}: ${storageDeleteError.message}. Proceeding with DB deletion.`);
            } else {
                console.log(`Successfully deleted avatar from storage for user ${authId} at path ${filePath}`);
            }
          } else {
             console.warn(`Could not accurately parse avatar path for user ${authId} from URL: ${avatarUrl}`);
          }
        } else {
          console.warn(`Avatar URL for user ${authId} does not seem to be a Supabase Storage URL or has unexpected format: ${avatarUrl}`);
        }
      } catch (e) {
        console.warn(`Error processing avatar URL for deletion (user ${authId}): ${(e as Error).message}`);
      }
    }

    // 3. Delete user's record from public.users table
    // This is a critical step. RLS policies on public.users might prevent this if not set correctly.
    // Ideally, this should be 'on delete cascade' for FKs or handled by a trigger if more complex logic is needed.
    // For now, we explicitly delete the user's profile.
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('auth_id', authId); // Match on auth_id to ensure we delete the correct profile

    if (deleteUserError) {
      console.error(`Error deleting user profile from 'users' table for auth_id ${authId}:`, deleteUserError);
      return NextResponse.json({ error: `Failed to delete user profile data: ${deleteUserError.message}` }, { status: 500 });
    }
    
    // Note: We are NOT deleting the auth.users entry here.
    // That requires admin privileges and is best handled by a Supabase Edge Function or manual admin action.
    // The user will be logged out on the client-side.

    console.log(`Successfully deleted profile data for user ${authId} (profile ID: ${profileId})`);
    return NextResponse.json({ success: true, message: 'User data (profile and avatar) has been removed. You will be logged out.' });

  } catch (e: unknown) {
    console.error('DELETE /api/account/delete general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during account data deletion.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
