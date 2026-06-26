import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { handler, parseBody, enforceRateLimit, ok } from '@/lib/api';
import { forgotPasswordSchema } from '@/lib/validations';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import { sendEmail, resetPasswordEmail } from '@/lib/email';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const limited = enforceRateLimit(req, 'auth:forgot', { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseBody(req, forgotPasswordSchema);
  if ('response' in parsed) return parsed.response;
  const { email } = parsed.data;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Always return success to prevent account enumeration.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    await db
      .update(users)
      .set({
        passwordResetToken: crypto.createHash('sha256').update(token).digest('hex'),
        passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000),
      })
      .where(eq(users.id, user.id));
    void sendEmail({ to: email, ...resetPasswordEmail(user.name, token) });
  }

  return ok({
    message: 'If an account exists for this email, a reset link has been sent.',
  });
});
