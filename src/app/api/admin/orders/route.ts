import type { NextRequest } from 'next/server';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { handler, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { orders } from '@/db/schema';
import { placedOrderCondition } from '@/server/orders';
import type { OrderStatus } from '@/types';

export const runtime = 'nodejs';

/** Escape LIKE wildcards so user input can't broaden the match (ReDoS-free). */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export const GET = handler(async (req: NextRequest) => {
  await requireRole();
  const db = getDb();

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? '20') || 20));
  const search = sp.get('search')?.trim();
  const status = sp.get('status')?.trim();

  // Always exclude provisional (unpaid online) orders from the admin list.
  const conditions: SQL[] = [placedOrderCondition()];
  if (status) conditions.push(eq(orders.status, status as OrderStatus));
  if (search) {
    const term = `%${likeEscape(search)}%`;
    conditions.push(or(ilike(orders.orderNumber, term), ilike(orders.email, term))!);
  }
  const where = and(...conditions);

  const [docs, totalRows] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(orders).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  return ok({
    data: docs.map((d) => ({
      _id: String(d.id),
      orderNumber: d.orderNumber,
      email: d.email,
      total: d.total,
      itemCount: d.items?.length ?? 0,
      paymentStatus: d.paymentStatus,
      paymentMethod: d.paymentMethod,
      status: d.status,
      createdAt: new Date(d.createdAt ?? Date.now()).toISOString(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});
