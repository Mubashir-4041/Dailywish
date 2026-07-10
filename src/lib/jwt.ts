import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { Role } from '@/types';

/**
 * Edge-compatible JWT signing/verification using `jose`.
 * Two token types are issued:
 *   • access  - short-lived (15m), carried in an httpOnly cookie & used for auth
 *   • refresh - long-lived (30d), used to silently mint new access tokens
 */

export interface AuthTokenPayload extends JWTPayload {
  sub: string; // user id
  email: string;
  role: Role;
  tv: number; // tokenVersion - bump to invalidate all sessions
}

const ACCESS_TTL = '15m';
const REFRESH_TTL = '30d';

export const ACCESS_COOKIE = 'dw_access';
export const REFRESH_COOKIE = 'dw_refresh';

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

function accessSecret() {
  return key(process.env.JWT_SECRET as string);
}
function refreshSecret() {
  return key(process.env.JWT_REFRESH_SECRET as string);
}

export async function signAccessToken(
  payload: Omit<AuthTokenPayload, keyof JWTPayload> &
    Pick<AuthTokenPayload, 'sub' | 'email' | 'role' | 'tv'>,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('dailywish')
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecret());
}

export async function signRefreshToken(
  payload: Pick<AuthTokenPayload, 'sub' | 'email' | 'role' | 'tv'>,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('dailywish')
    .setExpirationTime(REFRESH_TTL)
    .sign(refreshSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret(), {
      issuer: 'dailywish',
    });
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret(), {
      issuer: 'dailywish',
    });
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

export const tokenMaxAge = {
  access: 60 * 15, // 15 minutes
  refresh: 60 * 60 * 24 * 30, // 30 days
};

/**
 * Order-tracking token. Emailed as a magic link so a guest (no account) can
 * view a single order without logging in. Scoped to one orderNumber+email,
 * signed with the access secret, and long-lived (orders stay trackable for a
 * while). It grants read-only access to exactly one order — nothing else.
 */
interface OrderTokenPayload extends JWTPayload {
  ord: string; // orderNumber
  email: string;
  purpose: 'order-track';
}

const ORDER_TOKEN_TTL = '120d';

export async function signOrderToken(input: {
  orderNumber: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ ord: input.orderNumber, email: input.email, purpose: 'order-track' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('dailywish')
    .setExpirationTime(ORDER_TOKEN_TTL)
    .sign(accessSecret());
}

export async function verifyOrderToken(
  token: string,
): Promise<{ orderNumber: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret(), { issuer: 'dailywish' });
    const p = payload as OrderTokenPayload;
    if (p.purpose !== 'order-track' || !p.ord || !p.email) return null;
    return { orderNumber: p.ord, email: p.email };
  } catch {
    return null;
  }
}
