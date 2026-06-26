import type { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { handler, parseBody, enforceRateLimit, ok, created, fail } from '@/lib/api';
import { reviewSchema } from '@/lib/validations';
import { getDb } from '@/lib/db';
import { reviews, products } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = handler(async (req: NextRequest) => {
  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) return fail(400, 'productId is required');
  if (!process.env.DATABASE_URL) return ok({ reviews: [] });
  if (!UUID_RE.test(productId)) return ok({ reviews: [] });

  const db = getDb();
  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
    .orderBy(desc(reviews.createdAt))
    .limit(50);
  return ok({
    reviews: rows.map((r) => ({
      _id: String(r.id),
      name: r.name,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt,
    })),
  });
});

export const POST = handler(async (req: NextRequest) => {
  const limited = enforceRateLimit(req, 'reviews:create', { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseBody(req, reviewSchema);
  if ('response' in parsed) return parsed.response;
  const { productId, rating, title, comment, name } = parsed.data;

  if (!UUID_RE.test(productId)) return fail(404, 'Product not found');
  const db = getDb();
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) return fail(404, 'Product not found');

  const user = await getCurrentUser();
  const reviewerName = user?.name ?? name;
  if (!reviewerName) return fail(400, 'Name is required');

  await db.insert(reviews).values({
    productId,
    userId: user?.id ?? null,
    name: reviewerName,
    rating,
    title: title || null,
    comment,
    isApproved: false, // moderated by admin
    isVerifiedPurchase: false,
  });

  return created({
    message: 'Thank you! Your review has been submitted for moderation.',
  });
});
