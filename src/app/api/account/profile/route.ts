import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, parseBody, ok, fail } from '@/lib/api';
import { profileSchema } from '@/lib/validations';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';

export const runtime = 'nodejs';

export const PATCH = handler(async (req: NextRequest) => {
  const session = await requireUser();
  const parsed = await parseBody(req, profileSchema);
  if ('response' in parsed) return parsed.response;

  const db = getDb();
  const [user] = await db
    .update(users)
    .set({ name: parsed.data.name, phone: parsed.data.phone || null })
    .where(eq(users.id, session.id))
    .returning();
  if (!user) return fail(404, 'User not found');
  return ok({ user: { id: String(user.id), name: user.name, phone: user.phone } });
});
