import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, parseBody, ok, fail } from '@/lib/api';
import { changePasswordSchema } from '@/lib/validations';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import { requireUser, verifyPassword, hashPassword, createSession } from '@/lib/auth';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const session = await requireUser();
  const parsed = await parseBody(req, changePasswordSchema);
  if ('response' in parsed) return parsed.response;
  const { currentPassword, newPassword } = parsed.data;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user) return fail(404, 'User not found');

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return fail(400, 'Current password is incorrect');

  const tokenVersion = (user.tokenVersion ?? 0) + 1;
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), tokenVersion })
    .where(eq(users.id, user.id));

  // Re-issue session with the new token version.
  await createSession({
    id: String(user.id),
    email: user.email,
    role: user.role,
    tokenVersion,
  });

  return ok({ message: 'Password changed successfully.' });
});
