import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { handler, parseBody, ok, created, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { adminCouponSchema } from '@/lib/validations';
import { coupons } from '@/db/schema';
import { logAdminAction } from '@/server/audit';

export const runtime = 'nodejs';

export const GET = handler(async () => {
  await requireRole();
  const db = getDb();

  const docs = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return ok({
    data: docs.map((d) => ({
      _id: String(d.id),
      code: d.code,
      description: d.description ?? '',
      type: d.type,
      value: d.value,
      minSubtotal: d.minSubtotal ?? 0,
      maxDiscount: d.maxDiscount ?? null,
      usageLimit: d.usageLimit ?? null,
      usedCount: d.usedCount ?? 0,
      isActive: d.isActive !== false,
      expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString() : null,
      createdAt: new Date(d.createdAt ?? Date.now()).toISOString(),
    })),
  });
});

export const POST = handler(async (req: NextRequest) => {
  const admin = await requireRole();
  const db = getDb();

  const parsed = await parseBody(req, adminCouponSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const [existing] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.code, input.code))
    .limit(1);
  if (existing) return fail(409, 'A coupon with this code already exists');

  const doc = takeOne(await db
    .insert(coupons)
    .values({
      code: input.code,
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      minSubtotal: input.minSubtotal,
      maxDiscount: input.maxDiscount ?? null,
      usageLimit: input.usageLimit ?? null,
      isActive: input.isActive,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning({ id: coupons.id, code: coupons.code }));

  await logAdminAction(admin, 'coupon.create', 'Coupon', String(doc.id), {
    code: doc.code,
  });

  return created({ id: String(doc.id) });
});
