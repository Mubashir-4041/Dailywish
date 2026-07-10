import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { handler, parseBody, enforceRateLimit, created, fail, takeOne } from '@/lib/api';
import { registerSchema } from '@/lib/validations';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import { claimGuestOrders } from '@/server/orders';
import { hashPassword, createSession } from '@/lib/auth';
import { sendEmail, welcomeEmail, verifyEmail } from '@/lib/email';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const limited = enforceRateLimit(req, 'auth:register', { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseBody(req, registerSchema);
  if ('response' in parsed) return parsed.response;
  const { name, email, password } = parsed.data;

  const db = getDb();

  const [existing] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  // A real (password-bearing) account already owns this email — block. But a
  // passwordless "shadow" profile (auto-created for a guest checkout) has no
  // password yet, so registration CLAIMS it: set the password on that same row
  // rather than dead-ending, keeping the guest's order history attached.
  if (existing && existing.passwordHash) {
    return fail(409, 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationValues = {
    emailVerificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
    emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const user = takeOne(
    existing
      ? await db
          .update(users)
          .set({ name, passwordHash, role: 'customer', ...verificationValues })
          .where(eq(users.id, existing.id))
          .returning()
      : await db
          .insert(users)
          .values({
            name,
            email,
            passwordHash,
            role: 'customer',
            ...verificationValues,
          })
          .returning(),
  );

  await createSession({
    id: String(user.id),
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  // Adopt any orders this person placed as a guest with the same email.
  await claimGuestOrders(String(user.id), user.email);

  // Fire-and-forget transactional emails.
  void sendEmail({ to: email, ...welcomeEmail(name) });
  void sendEmail({ to: email, ...verifyEmail(name, verificationToken) });

  return created({
    user: { id: String(user.id), name: user.name, email: user.email, role: user.role },
  });
});
