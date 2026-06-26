import type { NextRequest } from 'next/server';
import { handler, parseBody, enforceRateLimit, ok } from '@/lib/api';
import { contactSchema } from '@/lib/validations';
import { sendEmail, contactNotificationEmail } from '@/lib/email';
import { siteConfig } from '@/config/site';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const limited = enforceRateLimit(req, 'contact', { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseBody(req, contactSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  await sendEmail({
    to: siteConfig.email,
    replyTo: input.email,
    ...contactNotificationEmail(input),
  });

  return ok({ message: 'Thank you! Your message has been sent.' });
});
