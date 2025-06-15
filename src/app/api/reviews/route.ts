
// src/app/api/reviews/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const authUserId = authUser.id;

    // Fetch public.users.id based on auth.users.id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id') // Select the primary key of public.users
      .eq('auth_id', authUserId)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile for review submission:', profileError);
      return NextResponse.json({ error: 'Could not find user profile to submit review.' }, { status: 500 });
    }
    const publicUserId = userProfile.id; // This is public.users.id

    const body = await req.json();
    const { product_id, rating, comment } = body;

    if (!product_id || rating === undefined || !comment) {
      return NextResponse.json({ error: 'Missing required fields: product_id, rating, comment' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const { data: reviewData, error: reviewInsertError } = await supabase
      .from('reviews')
      .insert({
        user_id: publicUserId, // Use the ID from public.users table
        product_id: product_id,
        rating: rating,
        comment: comment,
      })
      .select(`
        id,
        rating,
        comment,
        created_at,
        users ( id, name, avatar_url )
      `) // Select joined user data immediately
      .single();

    if (reviewInsertError) {
      console.error('Error inserting review:', reviewInsertError);
      return NextResponse.json({ error: `Failed to submit review: ${reviewInsertError.message}` }, { status: 500 });
    }
    
    // Format the single returned review
    const formattedReview = reviewData ? {
        id: reviewData.id,
        author: reviewData.users?.name || 'Anonymous',
        avatarUrl: reviewData.users?.avatar_url,
        rating: reviewData.rating,
        date: new Date(reviewData.created_at).toISOString().split('T')[0],
        comment: reviewData.comment,
    } : null;


    return NextResponse.json({ success: true, review: formattedReview });

  } catch (e: unknown) {
    console.error('POST /api/reviews general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const product_id = searchParams.get('product_id');

    if (!product_id) {
      return NextResponse.json({ error: 'product_id query parameter is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        users ( id, name, avatar_url ) 
      `)
      .eq('product_id', product_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const formattedReviews = data.map(r => ({
        id: r.id,
        author: r.users?.name || 'Anonymous',
        avatarUrl: r.users?.avatar_url,
        rating: r.rating,
        date: new Date(r.created_at).toISOString().split('T')[0],
        comment: r.comment,
    }));

    return NextResponse.json(formattedReviews);

  } catch (e: unknown) {
    console.error('GET /api/reviews general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    
