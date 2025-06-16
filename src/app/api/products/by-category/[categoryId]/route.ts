
// This API route was used to fetch products for a specific category ID
// for the dynamic /category/[categoryId] page.
// Since that page is being temporarily removed to simplify the application,
// this API endpoint is also being marked for removal.
// Product browsing will rely on the static section pages (e.g., /grocery) for now.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'This endpoint is currently disabled.' }, { status: 404 });
}
