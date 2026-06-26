import type { NextRequest } from 'next/server';
import { handler, parseBody, enforceRateLimit, ok } from '@/lib/api';
import { newsletterSchema } from '@/lib/validations';
import { getDb } from '@/lib/db';
import { newsletters } from '@/db/schema';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const limited = enforceRateLimit(req, 'newsletter', { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseBody(req, newsletterSchema);
  if ('response' in parsed) return parsed.response;
  const { email, source } = parsed.data;

  if (process.env.DATABASE_URL) {
    const db = getDb();
    // Idempotent subscribe: insert once, ignore if the email already exists.
    await db
      .insert(newsletters)
      .values({ email, source: source ?? 'footer', isActive: true })
      .onConflictDoNothing({ target: newsletters.email });
  }

  return ok({ message: 'Subscribed successfully' });
});
