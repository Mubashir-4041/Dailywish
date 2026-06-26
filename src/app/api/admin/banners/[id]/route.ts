import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, parseBody, ok, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { banners } from '@/db/schema';
import { logAdminAction } from '@/server/audit';
import { adminBannerSchema } from '../route';

export const runtime = 'nodejs';

type Ctx = { params?: Promise<Record<string, string>> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = handler(async (_req: NextRequest, ctx: Ctx) => {
  await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing banner id');
  if (!UUID_RE.test(id)) return fail(404, 'Banner not found');

  const [d] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!d) return fail(404, 'Banner not found');

  return ok({
    _id: String(d.id),
    title: d.title,
    subtitle: d.subtitle ?? '',
    image: d.image,
    ctaLabel: d.ctaLabel ?? '',
    ctaHref: d.ctaHref ?? '',
    placement: d.placement,
    isActive: d.isActive !== false,
    order: d.order ?? 0,
  });
});

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing banner id');
  if (!UUID_RE.test(id)) return fail(404, 'Banner not found');

  const parsed = await parseBody(req, adminBannerSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const [doc] = await db
    .select({ id: banners.id })
    .from(banners)
    .where(eq(banners.id, id))
    .limit(1);
  if (!doc) return fail(404, 'Banner not found');

  const updated = takeOne(await db
    .update(banners)
    .set({
      title: input.title,
      subtitle: input.subtitle || null,
      image: input.image,
      ctaLabel: input.ctaLabel || null,
      ctaHref: input.ctaHref || null,
      placement: input.placement,
      isActive: input.isActive,
      order: input.order,
      updatedAt: new Date(),
    })
    .where(eq(banners.id, doc.id))
    .returning({ id: banners.id, title: banners.title }));

  await logAdminAction(admin, 'banner.update', 'Banner', String(updated.id), {
    title: updated.title,
  });

  return ok({ id: String(updated.id) });
});

export const DELETE = handler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing banner id');
  if (!UUID_RE.test(id)) return fail(404, 'Banner not found');

  const [doc] = await db
    .delete(banners)
    .where(eq(banners.id, id))
    .returning({ id: banners.id, title: banners.title });
  if (!doc) return fail(404, 'Banner not found');

  await logAdminAction(admin, 'banner.delete', 'Banner', id, { title: doc.title });
  return ok({ success: true });
});
