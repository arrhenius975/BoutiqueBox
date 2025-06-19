// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Try to refresh the session if it's present and close to expiring
  // This helps keep the user logged in.
  // getSession() will automatically refresh the session if needed.
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error(`MIDDLEWARE: Error getting/refreshing session for path ${req.nextUrl.pathname}:`, error.message);
  } else if (session) {
    // console.log(`MIDDLEWARE: Session found/refreshed for path ${req.nextUrl.pathname}, user: ${session.user.email}`);
  } else {
    // console.log(`MIDDLEWARE: No active session found for path ${req.nextUrl.pathname}.`);
  }
  
  return res;
}

// Ensure the middleware is only called for relevant paths.
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
