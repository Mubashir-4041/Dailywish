import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { asc } from 'drizzle-orm';
import { handler, parseBody, ok, created, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { banners } from '@/db/schema';
import { logAdminAction } from '@/server/audit';

export const runtime = 'nodejs';

export const adminBannerSchema = z.object({
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(280).optional().or(z.literal('')),
  image: z.string().trim().min(1, 'Image is required'),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal('')),
  ctaHref: z.string().trim().max(200).optional().or(z.literal('')),
  placement: z.enum(['hero', 'promo', 'strip']),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

export const GET = handler(async () => {
  await requireRole();
  const db = getDb();

  const docs = await db
    .select()
    .from(banners)
    .orderBy(asc(banners.placement), asc(banners.order));
  return ok({
    data: docs.map((d) => ({
      _id: String(d.id),
      title: d.title,
      subtitle: d.subtitle ?? '',
      image: d.image,
      ctaLabel: d.ctaLabel ?? '',
      ctaHref: d.ctaHref ?? '',
      placement: d.placement,
      isActive: d.isActive !== false,
      order: d.order ?? 0,
    })),
  });
});

export const POST = handler(async (req: NextRequest) => {
  const admin = await requireRole();
  const db = getDb();

  const parsed = await parseBody(req, adminBannerSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const doc = takeOne(await db
    .insert(banners)
    .values({
      title: input.title,
      subtitle: input.subtitle || null,
      image: input.image,
      ctaLabel: input.ctaLabel || null,
      ctaHref: input.ctaHref || null,
      placement: input.placement,
      isActive: input.isActive,
      order: input.order,
    })
    .returning({ id: banners.id, title: banners.title }));

  await logAdminAction(admin, 'banner.create', 'Banner', String(doc.id), {
    title: doc.title,
  });

  return created({ id: String(doc.id) });
});
