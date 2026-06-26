import type { NextRequest } from 'next/server';
import { asc, count, eq } from 'drizzle-orm';
import { handler, parseBody, ok, created, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { adminCategorySchema } from '@/lib/validations';
import { categories, products } from '@/db/schema';
import { logAdminAction } from '@/server/audit';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

export const GET = handler(async () => {
  await requireRole();
  const db = getDb();

  const docs = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.order), asc(categories.name));

  const counts = await db
    .select({ slug: products.categorySlug, value: count() })
    .from(products)
    .groupBy(products.categorySlug);
  const countMap = new Map(counts.map((c) => [c.slug, c.value]));

  return ok({
    data: docs.map((d) => ({
      _id: String(d.id),
      name: d.name,
      slug: d.slug,
      description: d.description ?? '',
      image: d.image ?? '',
      icon: d.icon ?? '',
      isActive: d.isActive !== false,
      order: d.order ?? 0,
      productCount: countMap.get(d.slug) ?? 0,
    })),
  });
});

export const POST = handler(async (req: NextRequest) => {
  const admin = await requireRole();
  const db = getDb();

  const parsed = await parseBody(req, adminCategorySchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (existing) return fail(409, 'A category with this slug already exists');

  const doc = takeOne(await db
    .insert(categories)
    .values({
      name: input.name,
      slug,
      description: input.description,
      image: input.image ?? null,
      icon: input.icon ?? null,
      isActive: input.isActive,
      order: input.order,
    })
    .returning({ id: categories.id, slug: categories.slug, name: categories.name }));

  await logAdminAction(admin, 'category.create', 'Category', String(doc.id), {
    name: doc.name,
  });

  return created({ id: String(doc.id), slug: doc.slug });
});
