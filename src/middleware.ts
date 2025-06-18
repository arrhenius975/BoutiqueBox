// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - important to keep session alive for server-side rendering
  // and API routes.
  await supabase.auth.getSession();

  return res;
}

// Ensure the middleware is only called for relevant paths.
// Adjust this to match the paths where your Supabase auth is needed.
// For example, if you want it to run on all paths except static assets:
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
