import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, parseBody, enforceRateLimit, ok, fail } from '@/lib/api';
import { loginSchema } from '@/lib/validations';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import { verifyPassword, createSession } from '@/lib/auth';
import { claimGuestOrders } from '@/server/orders';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  // Brute-force protection: 8 attempts / minute / IP.
  const limited = enforceRateLimit(req, 'auth:login', { limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseBody(req, loginSchema);
  if ('response' in parsed) return parsed.response;
  const { email, password } = parsed.data;

  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Constant-ish response to avoid user enumeration.
  if (!user || !user.isActive) {
    return fail(401, 'Invalid email or password');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail(401, 'Invalid email or password');

  // Fire-and-forget: `lastLoginAt` is non-critical, so don't make the user wait
  // an extra round-trip to the DB region for it before the response is sent.
  void (async () => {
    try {
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    } catch {
      // best-effort only
    }
  })();

  await createSession({
    id: String(user.id),
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  // Adopt any orders placed as a guest with this email before they had an account.
  await claimGuestOrders(String(user.id), user.email);

  return ok({
    user: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});
