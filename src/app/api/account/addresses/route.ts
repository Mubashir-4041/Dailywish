import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { handler, parseBody, ok, created, fail } from '@/lib/api';
import { addressSchema } from '@/lib/validations';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import type { Address } from '@/types';

export const runtime = 'nodejs';

export const GET = handler(async () => {
  const session = await requireUser();
  const db = getDb();
  const [user] = await db
    .select({ addresses: users.addresses })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);
  return ok({ addresses: user?.addresses ?? [] });
});

export const POST = handler(async (req: NextRequest) => {
  const session = await requireUser();
  const parsed = await parseBody(req, addressSchema);
  if ('response' in parsed) return parsed.response;
  const address = parsed.data;

  const db = getDb();
  const [user] = await db
    .select({ addresses: users.addresses })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);
  if (!user) return fail(404, 'User not found');

  const addresses = [...(user.addresses ?? [])];
  let isDefault = !!address.isDefault;
  if (isDefault || addresses.length === 0) {
    for (const a of addresses) a.isDefault = false;
    isDefault = true;
  }
  addresses.push({ ...(address as Address), isDefault, _id: crypto.randomUUID() });

  await db.update(users).set({ addresses }).where(eq(users.id, session.id));
  return created({ addresses });
});
