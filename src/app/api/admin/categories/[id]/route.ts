import type { NextRequest } from 'next/server';
import { and, count, eq, ne } from 'drizzle-orm';
import { handler, parseBody, ok, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { adminCategorySchema } from '@/lib/validations';
import { categories, products } from '@/db/schema';
import { logAdminAction } from '@/server/audit';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

type Ctx = { params?: Promise<Record<string, string>> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = handler(async (_req: NextRequest, ctx: Ctx) => {
  await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing category id');
  if (!UUID_RE.test(id)) return fail(404, 'Category not found');

  const [doc] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!doc) return fail(404, 'Category not found');

  return ok({
    _id: String(doc.id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? '',
    image: doc.image ?? '',
    icon: doc.icon ?? '',
    isActive: doc.isActive !== false,
    order: doc.order ?? 0,
  });
});

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing category id');
  if (!UUID_RE.test(id)) return fail(404, 'Category not found');

  const parsed = await parseBody(req, adminCategorySchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const [doc] = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!doc) return fail(404, 'Category not found');

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  const [clash] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(ne(categories.id, doc.id), eq(categories.slug, slug)))
    .limit(1);
  if (clash) return fail(409, 'Another category already uses this slug');

  const prevSlug = doc.slug;
  const updated = takeOne(await db
    .update(categories)
    .set({
      name: input.name,
      slug,
      description: input.description,
      image: input.image ?? null,
      icon: input.icon ?? null,
      isActive: input.isActive,
      order: input.order,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, doc.id))
    .returning({ id: categories.id, slug: categories.slug, name: categories.name }));

  // Keep denormalized product fields in sync.
  if (prevSlug !== slug || input.name) {
    await db
      .update(products)
      .set({ categorySlug: slug, categoryName: input.name, updatedAt: new Date() })
      .where(eq(products.categorySlug, prevSlug));
  }

  await logAdminAction(admin, 'category.update', 'Category', String(updated.id), {
    name: updated.name,
  });

  return ok({ id: String(updated.id), slug: updated.slug });
});

export const DELETE = handler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing category id');
  if (!UUID_RE.test(id)) return fail(404, 'Category not found');

  const [doc] = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!doc) return fail(404, 'Category not found');

  const productCountRows = await db
    .select({ value: count() })
    .from(products)
    .where(eq(products.categorySlug, doc.slug));
  const productCount = productCountRows[0]?.value ?? 0;
  if (productCount > 0) {
    return fail(409, `Cannot delete: ${productCount} product(s) use this category`);
  }

  await db.delete(categories).where(eq(categories.id, doc.id));
  await logAdminAction(admin, 'category.delete', 'Category', id, {
    name: doc.name,
  });

  return ok({ success: true });
});
