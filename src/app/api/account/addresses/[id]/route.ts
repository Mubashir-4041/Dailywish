import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, ok, fail } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';

export const runtime = 'nodejs';

export const DELETE = handler(
  async (_req: NextRequest, ctx: { params?: Promise<Record<string, string>> }) => {
    const session = await requireUser();
    const params = ctx.params ? await ctx.params : {};
    const db = getDb();
    const [user] = await db
      .select({ addresses: users.addresses })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    if (!user) return fail(404, 'User not found');
    const addresses = (user.addresses ?? []).filter((a) => a._id !== params.id);
    await db.update(users).set({ addresses }).where(eq(users.id, session.id));
    return ok({ addresses });
  },
);

export const PATCH = handler(
  async (_req: NextRequest, ctx: { params?: Promise<Record<string, string>> }) => {
    const session = await requireUser();
    const params = ctx.params ? await ctx.params : {};
    const db = getDb();
    const [user] = await db
      .select({ addresses: users.addresses })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    if (!user) return fail(404, 'User not found');
    const addresses = (user.addresses ?? []).map((a) => ({
      ...a,
      isDefault: a._id === params.id,
    }));
    await db.update(users).set({ addresses }).where(eq(users.id, session.id));
    return ok({ addresses });
  },
);
