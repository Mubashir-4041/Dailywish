import { and, desc, eq } from 'drizzle-orm';
import { handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { orders } from '@/db/schema';
import { placedOrderCondition } from '@/server/orders';

export const runtime = 'nodejs';

export const GET = handler(async () => {
  const user = await requireUser();
  if (!process.env.DATABASE_URL) return ok({ orders: [] });

  const db = getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, user.id), placedOrderCondition()))
    .orderBy(desc(orders.createdAt))
    .limit(100);
  return ok({
    orders: rows.map((o) => ({
      ...o,
      _id: String(o.id),
      user: o.userId ? String(o.userId) : undefined,
    })),
  });
});
