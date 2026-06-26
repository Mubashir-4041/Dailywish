import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, parseBody, ok, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { testimonials } from '@/db/schema';
import { logAdminAction } from '@/server/audit';
import { adminTestimonialSchema } from '../route';

export const runtime = 'nodejs';

type Ctx = { params?: Promise<Record<string, string>> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = handler(async (_req: NextRequest, ctx: Ctx) => {
  await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing testimonial id');
  if (!UUID_RE.test(id)) return fail(404, 'Testimonial not found');

  const [d] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
  if (!d) return fail(404, 'Testimonial not found');

  return ok({
    _id: String(d.id),
    name: d.name,
    role: d.role ?? '',
    avatar: d.avatar ?? '',
    rating: d.rating,
    quote: d.quote,
    isActive: d.isActive !== false,
    order: d.order ?? 0,
  });
});

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing testimonial id');
  if (!UUID_RE.test(id)) return fail(404, 'Testimonial not found');

  const parsed = await parseBody(req, adminTestimonialSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const [doc] = await db
    .select({ id: testimonials.id })
    .from(testimonials)
    .where(eq(testimonials.id, id))
    .limit(1);
  if (!doc) return fail(404, 'Testimonial not found');

  const updated = takeOne(await db
    .update(testimonials)
    .set({
      name: input.name,
      role: input.role || null,
      avatar: input.avatar || null,
      rating: input.rating,
      quote: input.quote,
      isActive: input.isActive,
      order: input.order,
      updatedAt: new Date(),
    })
    .where(eq(testimonials.id, doc.id))
    .returning({ id: testimonials.id, name: testimonials.name }));

  await logAdminAction(admin, 'testimonial.update', 'Testimonial', String(updated.id), {
    name: updated.name,
  });

  return ok({ id: String(updated.id) });
});

export const DELETE = handler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing testimonial id');
  if (!UUID_RE.test(id)) return fail(404, 'Testimonial not found');

  const [doc] = await db
    .delete(testimonials)
    .where(eq(testimonials.id, id))
    .returning({ id: testimonials.id, name: testimonials.name });
  if (!doc) return fail(404, 'Testimonial not found');

  await logAdminAction(admin, 'testimonial.delete', 'Testimonial', id, {
    name: doc.name,
  });
  return ok({ success: true });
});
