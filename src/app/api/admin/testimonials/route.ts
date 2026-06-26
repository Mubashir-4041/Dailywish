import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { asc, desc } from 'drizzle-orm';
import { handler, parseBody, ok, created, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { testimonials } from '@/db/schema';
import { logAdminAction } from '@/server/audit';

export const runtime = 'nodejs';

export const adminTestimonialSchema = z.object({
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().max(120).optional().or(z.literal('')),
  avatar: z.string().trim().max(300).optional().or(z.literal('')),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  quote: z.string().trim().min(5).max(600),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

export const GET = handler(async () => {
  await requireRole();
  const db = getDb();

  const docs = await db
    .select()
    .from(testimonials)
    .orderBy(asc(testimonials.order), desc(testimonials.createdAt));
  return ok({
    data: docs.map((d) => ({
      _id: String(d.id),
      name: d.name,
      role: d.role ?? '',
      avatar: d.avatar ?? '',
      rating: d.rating,
      quote: d.quote,
      isActive: d.isActive !== false,
      order: d.order ?? 0,
    })),
  });
});

export const POST = handler(async (req: NextRequest) => {
  const admin = await requireRole();
  const db = getDb();

  const parsed = await parseBody(req, adminTestimonialSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const doc = takeOne(await db
    .insert(testimonials)
    .values({
      name: input.name,
      role: input.role || null,
      avatar: input.avatar || null,
      rating: input.rating,
      quote: input.quote,
      isActive: input.isActive,
      order: input.order,
    })
    .returning({ id: testimonials.id, name: testimonials.name }));

  await logAdminAction(admin, 'testimonial.create', 'Testimonial', String(doc.id), {
    name: doc.name,
  });

  return created({ id: String(doc.id) });
});
