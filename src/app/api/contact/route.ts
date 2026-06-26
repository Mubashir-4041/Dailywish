import type { NextRequest } from 'next/server';
import { handler, parseBody, enforceRateLimit, ok } from '@/lib/api';
import { contactSchema } from '@/lib/validations';
import { sendEmail, contactNotificationEmail } from '@/lib/email';
import { getDb } from '@/lib/db';
import { contactMessages } from '@/db/schema';
import { siteConfig } from '@/config/site';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const limited = enforceRateLimit(req, 'contact', { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseBody(req, contactSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  // Persist to the admin inbox so it shows on the dashboard (the primary
  // destination). Fields are mapped explicitly — never spread req.body.
  if (process.env.DATABASE_URL) {
    const db = getDb();
    await db.insert(contactMessages).values({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject,
      message: input.message,
    });
  }

  // Also notify by email (best-effort; never block the response on it).
  void sendEmail({
    to: siteConfig.email,
    replyTo: input.email,
    ...contactNotificationEmail(input),
  }).catch(() => undefined);

  return ok({ message: 'Thank you! Your message has been sent.' });
});
