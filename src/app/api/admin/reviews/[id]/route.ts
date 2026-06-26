import type { NextRequest } from 'next/server';
import { and, count, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { handler, parseBody, ok, fail } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { reviews, products } from '@/db/schema';
import { logAdminAction } from '@/server/audit';

export const runtime = 'nodejs';

type Ctx = { params?: Promise<Record<string, string>> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const updateReviewSchema = z.object({ isApproved: z.boolean() });

/** Recompute a product's rating + review count from its approved reviews. */
async function recomputeProductRating(productId: string): Promise<void> {
  const db = getDb();
  const [stats] = await db
    .select({
      avg: sql<number>`coalesce(avg(${reviews.rating}),0)::float8`,
      count: count(),
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)));
  const numReviews = stats?.count ?? 0;
  const rating = numReviews ? Math.round((stats?.avg ?? 0) * 10) / 10 : 0;
  await db
    .update(products)
    .set({ rating, numReviews, updatedAt: new Date() })
    .where(eq(products.id, productId));
}

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing review id');
  if (!UUID_RE.test(id)) return fail(404, 'Review not found');

  const parsed = await parseBody(req, updateReviewSchema);
  if ('response' in parsed) return parsed.response;

  const [updated] = await db
    .update(reviews)
    .set({ isApproved: parsed.data.isApproved, updatedAt: new Date() })
    .where(eq(reviews.id, id))
    .returning();
  if (!updated) return fail(404, 'Review not found');

  await recomputeProductRating(String(updated.productId));

  await logAdminAction(
    admin,
    parsed.data.isApproved ? 'review.approve' : 'review.unapprove',
    'Review',
    String(updated.id),
  );

  return ok({ _id: String(updated.id), isApproved: updated.isApproved });
});

export const DELETE = handler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing review id');
  if (!UUID_RE.test(id)) return fail(404, 'Review not found');

  const [doc] = await db
    .delete(reviews)
    .where(eq(reviews.id, id))
    .returning({ id: reviews.id, productId: reviews.productId });
  if (!doc) return fail(404, 'Review not found');

  await recomputeProductRating(String(doc.productId));
  await logAdminAction(admin, 'review.delete', 'Review', id);

  return ok({ success: true });
});
