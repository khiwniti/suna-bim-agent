/**
 * Next.js Middleware
 *
 * Handles authentication, route protection, and custom domain routing
 * for white-label tenant support.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getTenantRewritePath } from '@/lib/routes/tenant-detection';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/settings',
];

// Auth routes (redirect to dashboard if authenticated)
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signin',
  '/auth/signup',
];

// System domains that are not custom tenant domains
const SYSTEM_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'bim.getintheq.space',
  'carbonbim.com',
  'vercel.app',
];

/**
 * Check if the hostname is a custom tenant domain
 */
function isCustomTenantDomain(hostname: string): boolean {
  const normalizedHost = hostname.split(':')[0].toLowerCase();

  // Check if it's a system domain
  for (const systemDomain of SYSTEM_DOMAINS) {
    if (normalizedHost === systemDomain || normalizedHost.endsWith(`.${systemDomain}`)) {
      return false;
    }
  }

  return true;
}

/**
 * Extract tenant info from hostname for custom domains
 * Returns null if not a custom domain
 */
function extractTenantDomain(hostname: string): string | null {
  if (!isCustomTenantDomain(hostname)) {
    return null;
  }

  // Normalize the hostname
  return hostname.split(':')[0].toLowerCase();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Check for tenant route rewrite
  const tenantRewritePath = getTenantRewritePath(pathname);
  if (tenantRewritePath) {
    return NextResponse.rewrite(new URL(tenantRewritePath, request.url));
  }

  // Extract custom tenant domain if applicable
  const tenantDomain = extractTenantDomain(hostname);

  // Create response to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add tenant domain header for downstream processing
  if (tenantDomain) {
    response.headers.set('x-tenant-domain', tenantDomain);
  }

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is auth route
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Set tenant domain header on final response if custom domain
  if (tenantDomain) {
    response.headers.set('x-tenant-domain', tenantDomain);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
