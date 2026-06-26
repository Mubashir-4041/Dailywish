import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { handler, parseBody, ok, fail } from '@/lib/api';
import { resetPasswordSchema } from '@/lib/validations';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const parsed = await parseBody(req, resetPasswordSchema);
  if ('response' in parsed) return parsed.response;
  const { token, password } = parsed.data;

  const db = getDb();
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.passwordResetToken, hashed),
        gt(users.passwordResetExpiry, new Date()),
      ),
    )
    .limit(1);

  if (!user) return fail(400, 'This reset link is invalid or has expired.');

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(password),
      passwordResetToken: null,
      passwordResetExpiry: null,
      tokenVersion: (user.tokenVersion ?? 0) + 1, // invalidate existing sessions
    })
    .where(eq(users.id, user.id));

  return ok({ message: 'Password reset successful. You can now sign in.' });
});
