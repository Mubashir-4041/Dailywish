import type { NextRequest } from 'next/server';
import { and, count, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { handler, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { reviews, products } from '@/db/schema';

export const runtime = 'nodejs';

export const GET = handler(async (req: NextRequest) => {
  await requireRole();
  const db = getDb();

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? '20') || 20));
  const filterParam = sp.get('filter');

  const conditions: SQL[] = [];
  if (filterParam === 'pending') conditions.push(eq(reviews.isApproved, false));
  else if (filterParam === 'approved') conditions.push(eq(reviews.isApproved, true));
  const where = conditions.length ? and(...conditions) : undefined;

  const [docs, totalRows] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(reviews).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  const productIds = [...new Set(docs.map((d) => String(d.productId)))];
  const prodRows = productIds.length
    ? await db
        .select({ id: products.id, name: products.name, slug: products.slug })
        .from(products)
        .where(inArray(products.id, productIds))
    : [];
  const productMap = new Map(
    prodRows.map((p) => [String(p.id), { name: p.name, slug: p.slug }]),
  );

  return ok({
    data: docs.map((d) => {
      const prod = productMap.get(String(d.productId));
      return {
        _id: String(d.id),
        product: String(d.productId),
        productName: prod?.name ?? 'Unknown product',
        productSlug: prod?.slug ?? '',
        name: d.name,
        rating: d.rating,
        title: d.title ?? '',
        comment: d.comment,
        isApproved: !!d.isApproved,
        isVerifiedPurchase: !!d.isVerifiedPurchase,
        createdAt: new Date(d.createdAt ?? Date.now()).toISOString(),
      };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});
