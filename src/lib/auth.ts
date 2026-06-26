import 'server-only';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  tokenMaxAge,
  type AuthTokenPayload,
} from '@/lib/jwt';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import type { Role } from '@/types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const isProd = process.env.NODE_ENV === 'production';

const baseCookie = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
};

/** Issue access + refresh cookies for a user. */
export async function createSession(user: {
  id: string;
  email: string;
  role: Role;
  tokenVersion: number;
}) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tv: user.tokenVersion,
  };
  const [access, refresh] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  const store = await cookies();
  store.set(ACCESS_COOKIE, access, {
    ...baseCookie,
    maxAge: tokenMaxAge.access,
  });
  store.set(REFRESH_COOKIE, refresh, {
    ...baseCookie,
    maxAge: tokenMaxAge.refresh,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/**
 * Resolve the current session token from cookies, transparently refreshing
 * the access token from a valid refresh token when it has expired.
 */
export async function getSessionPayload(): Promise<AuthTokenPayload | null> {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  if (access) {
    const payload = await verifyAccessToken(access);
    if (payload) return payload;
  }

  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  const refreshPayload = await verifyRefreshToken(refresh);
  if (!refreshPayload) return null;

  // Mint a fresh access token.
  const fresh = await signAccessToken({
    sub: refreshPayload.sub,
    email: refreshPayload.email,
    role: refreshPayload.role,
    tv: refreshPayload.tv,
  });
  // Best-effort persistence: writing cookies only works in a mutation context
  // (Route Handler / Server Action). During an RSC page/layout render the
  // cookie store is read-only and `set` throws - swallow it. The caller is
  // still authenticated via the valid refresh token for this request, and the
  // access cookie is re-minted on the next request that can write cookies.
  try {
    store.set(ACCESS_COOKIE, fresh, {
      ...baseCookie,
      maxAge: tokenMaxAge.access,
    });
  } catch {
    // read-only cookie store during render - ignore
  }
  return refreshPayload;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
}

/** Load the full, current user from the DB (null if unauthenticated). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const payload = await getSessionPayload();
  if (!payload) return null;
  if (!process.env.DATABASE_URL) {
    // Dev fallback - trust the signed token.
    return {
      id: payload.sub,
      name: payload.email.split('@')[0] ?? 'User',
      email: payload.email,
      role: payload.role,
      isEmailVerified: true,
    };
  }
  try {
    if (!UUID_RE.test(payload.sub)) return null;
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    if (!user || !user.isActive) return null;
    // Token invalidation check.
    if ((user.tokenVersion ?? 0) !== payload.tv) return null;
    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  } catch {
    return null;
  }
}

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Throw 401 if not authenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, 'Authentication required');
  return user;
}

const ADMIN_ROLES: Role[] = ['admin', 'super_admin'];

/** Throw 401/403 unless the user has one of the allowed roles. */
export async function requireRole(
  roles: Role[] = ADMIN_ROLES,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError(403, 'You do not have permission to access this resource');
  }
  return user;
}

export const isAdminRole = (role: Role) => ADMIN_ROLES.includes(role);
