import { NextResponse, type NextRequest } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  verifyAccessToken,
  verifyRefreshToken,
  type AuthTokenPayload,
} from '@/lib/jwt';
import type { Role } from '@/types';

// Inlined here (NOT imported from @/lib/auth) so the Edge middleware bundle
// stays free of Node-only deps like Mongoose & bcrypt.
const isAdminRole = (role: Role) => role === 'admin' || role === 'super_admin';

/**
 * Edge middleware:
 *   1. Applies a Content-Security-Policy and security headers to every response.
 *   2. Guards /admin (admin roles only) and /account (any authenticated user).
 */

async function resolvePayload(
  req: NextRequest,
): Promise<AuthTokenPayload | null> {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access) {
    const p = await verifyAccessToken(access);
    if (p) return p;
  }
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refresh) return verifyRefreshToken(refresh);
  return null;
}

function buildCsp(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const directives = [
    `default-src 'self'`,
    // Next.js requires inline styles; allow images from self + Cloudinary/data/blob.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com`,
    `font-src 'self' data:`,
    // 'unsafe-eval' only in dev for React Refresh. js.stripe.com is required to
    // load Stripe.js (the card Payment Element).
    `script-src 'self' 'unsafe-inline' https://js.stripe.com${isProd ? '' : " 'unsafe-eval'"}`,
    // Stripe.js talks to api.stripe.com; the Payment Element iframe is served
    // from js.stripe.com and 3-D Secure challenges from hooks.stripe.com.
    `connect-src 'self' https://api.stripe.com`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.google.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join('; ');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const res = NextResponse.next();
  res.headers.set('Content-Security-Policy', buildCsp());

  const isAdminPath = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAccountPath = pathname.startsWith('/account');

  if (isAdminPath || isAccountPath) {
    const payload = await resolvePayload(req);

    if (!payload) {
      const url = req.nextUrl.clone();
      url.pathname = isAdminPath ? '/admin/login' : '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (isAdminPath && !isAdminRole(payload.role)) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets & image optimizer so the CSP &
     * guards apply to pages and API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|products|banners|testimonials|originals|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)',
  ],
};
