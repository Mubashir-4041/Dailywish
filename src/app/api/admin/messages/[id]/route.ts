import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { handler, parseBody, ok, fail } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { contactMessages } from '@/db/schema';

export const runtime = 'nodejs';

type Ctx = { params?: Promise<Record<string, string>> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const patchSchema = z.object({ isRead: z.boolean() });

/** Mark a message read/unread. */
export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  await requireRole();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id || !UUID_RE.test(id)) return fail(404, 'Message not found');

  const parsed = await parseBody(req, patchSchema);
  if ('response' in parsed) return parsed.response;

  const db = getDb();
  const [row] = await db
    .update(contactMessages)
    .set({ isRead: parsed.data.isRead })
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id });
  if (!row) return fail(404, 'Message not found');
  return ok({ success: true });
});

/** Delete a message. */
export const DELETE = handler(async (_req: NextRequest, ctx: Ctx) => {
  await requireRole();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id || !UUID_RE.test(id)) return fail(404, 'Message not found');

  const db = getDb();
  const [row] = await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id });
  if (!row) return fail(404, 'Message not found');
  return ok({ success: true });
});
