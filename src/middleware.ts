
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  console.log(`MIDDLEWARE: Running for path: ${req.nextUrl.pathname}`);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error(`MIDDLEWARE: Error getting session for path ${req.nextUrl.pathname}:`, sessionError.message);
    // Allow request to proceed, API routes will handle auth errors
    return res;
  }

  if (session) {
    console.log(`MIDDLEWARE: Session found for path ${req.nextUrl.pathname}, user: ${session.user.email}`);
  } else {
    console.log(`MIDDLEWARE: No active session found for path ${req.nextUrl.pathname}.`);
  }

  // Admin route protection
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      console.log(`MIDDLEWARE: No session for /admin path ${req.nextUrl.pathname}. Redirecting to signin.`);
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/signin';
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname); // Keep original intended path
      return NextResponse.redirect(redirectUrl);
    }

    // Check admin role
    console.log(`MIDDLEWARE: Checking admin role for user ${session.user.id} on path ${req.nextUrl.pathname}.`);
    const { data: profile, error: profileError } = await supabase
      .from('users') // Assuming your profiles table is 'users'
      .select('role')
      .eq('auth_id', session.user.id)
      .single();

    if (profileError) {
      console.error(`MIDDLEWARE: Error fetching profile for admin check on path ${req.nextUrl.pathname}:`, profileError.message);
      // If profile fetch fails, redirect to a general error or not-authorized page.
      // For now, redirecting to not-authorized.
      return NextResponse.redirect(new URL('/not-authorized', req.url));
    }

    if (profile?.role !== 'admin') {
      console.log(`MIDDLEWARE: User ${session.user.email} is not an admin (role: ${profile?.role}). Redirecting from ${req.nextUrl.pathname} to /not-authorized.`);
      return NextResponse.redirect(new URL('/not-authorized', req.url));
    }
    console.log(`MIDDLEWARE: User ${session.user.email} is an admin. Allowing access to ${req.nextUrl.pathname}.`);
  }
  
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * We want this to run for API routes and admin pages.
     * A more specific matcher for admin could be '/admin/:path*',
     * but the broad one also ensures API routes get session handling.
     * The specific /admin check is now inside the middleware logic.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // If you want to be very specific for admin and related APIs:
    // '/admin/:path*',
    // '/api/admin/:path*', // If your admin APIs are under /api/admin
  ],
};
