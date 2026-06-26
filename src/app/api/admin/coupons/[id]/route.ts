import type { NextRequest } from 'next/server';
import { and, eq, ne } from 'drizzle-orm';
import { handler, parseBody, ok, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { adminCouponSchema } from '@/lib/validations';
import { coupons } from '@/db/schema';
import { logAdminAction } from '@/server/audit';

export const runtime = 'nodejs';

type Ctx = { params?: Promise<Record<string, string>> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = handler(async (_req: NextRequest, ctx: Ctx) => {
  await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing coupon id');
  if (!UUID_RE.test(id)) return fail(404, 'Coupon not found');

  const [d] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!d) return fail(404, 'Coupon not found');

  return ok({
    _id: String(d.id),
    code: d.code,
    description: d.description ?? '',
    type: d.type,
    value: d.value,
    minSubtotal: d.minSubtotal ?? 0,
    maxDiscount: d.maxDiscount ?? undefined,
    usageLimit: d.usageLimit ?? undefined,
    isActive: d.isActive !== false,
    expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString().slice(0, 10) : '',
  });
});

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing coupon id');
  if (!UUID_RE.test(id)) return fail(404, 'Coupon not found');

  const parsed = await parseBody(req, adminCouponSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const [doc] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.id, id))
    .limit(1);
  if (!doc) return fail(404, 'Coupon not found');

  const [clash] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(and(ne(coupons.id, doc.id), eq(coupons.code, input.code)))
    .limit(1);
  if (clash) return fail(409, 'Another coupon already uses this code');

  const updated = takeOne(await db
    .update(coupons)
    .set({
      code: input.code,
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      minSubtotal: input.minSubtotal,
      maxDiscount: input.maxDiscount ?? null,
      usageLimit: input.usageLimit ?? null,
      isActive: input.isActive,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, doc.id))
    .returning({ id: coupons.id, code: coupons.code }));

  await logAdminAction(admin, 'coupon.update', 'Coupon', String(updated.id), {
    code: updated.code,
  });

  return ok({ id: String(updated.id) });
});

export const DELETE = handler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing coupon id');
  if (!UUID_RE.test(id)) return fail(404, 'Coupon not found');

  const [doc] = await db
    .delete(coupons)
    .where(eq(coupons.id, id))
    .returning({ id: coupons.id, code: coupons.code });
  if (!doc) return fail(404, 'Coupon not found');

  await logAdminAction(admin, 'coupon.delete', 'Coupon', id, { code: doc.code });
  return ok({ success: true });
});
