// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log(`MIDDLEWARE: Running for path: ${req.nextUrl.pathname}`);
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("MIDDLEWARE: Error getting session:", error.message);
    } else if (session) {
      console.log("MIDDLEWARE: Session found, user:", session.user.email);
    } else {
      console.log("MIDDLEWARE: No active session found by middleware.");
    }
  } catch (e) {
    console.error("MIDDLEWARE: Exception during getSession():", (e as Error).message);
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
