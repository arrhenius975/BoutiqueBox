
// src/app/api/reviews/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const userId = user.id;

    const body = await req.json();
    const { product_id, rating, comment, author_name } = body; // author_name for cases where user name isn't readily available client-side

    if (!product_id || rating === undefined || !comment) {
      return NextResponse.json({ error: 'Missing required fields: product_id, rating, comment' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }


    const { data: reviewData, error: reviewInsertError } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        product_id: product_id,
        rating: rating,
        comment: comment,
        // author_name: author_name, // If you add an author_name column to reviews table for non-logged-in or simpler display
      })
      .select()
      .single();

    if (reviewInsertError) {
      console.error('Error inserting review:', reviewInsertError);
      return NextResponse.json({ error: `Failed to submit review: ${reviewInsertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, review: reviewData });

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
    
    // Transform data to match frontend Review type expectation (author from users.name)
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

    