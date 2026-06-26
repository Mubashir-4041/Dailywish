import type { NextRequest } from 'next/server';
import { and, eq, ne, or } from 'drizzle-orm';
import { handler, parseBody, ok, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { adminProductSchema } from '@/lib/validations';
import { products, categories } from '@/db/schema';
import { logAdminAction } from '@/server/audit';
import { purgeUnusedImages } from '@/server/media';
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
  if (!id || !UUID_RE.test(id)) return fail(404, 'Product not found');

  const [doc] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!doc) return fail(404, 'Product not found');

  return ok({
    _id: String(doc.id),
    name: doc.name,
    slug: doc.slug,
    shortDescription: doc.shortDescription ?? '',
    description: doc.description ?? '',
    category: String(doc.categoryId),
    price: doc.price,
    comparePrice: doc.comparePrice ?? undefined,
    costPrice: doc.costPrice ?? undefined,
    sku: doc.sku,
    stock: doc.stock ?? 0,
    images: (doc.images ?? []).map((i) => ({
      url: i.url,
      alt: i.alt ?? '',
      isPrimary: !!i.isPrimary,
    })),
    variants: doc.variants ?? [],
    features: doc.features ?? [],
    ingredients: doc.ingredients ?? '',
    howToUse: doc.howToUse ?? '',
    size: doc.size ?? '',
    tags: doc.tags ?? [],
    isFeatured: !!doc.isFeatured,
    isBestSeller: !!doc.isBestSeller,
    isNewArrival: !!doc.isNewArrival,
    isActive: doc.isActive !== false,
  });
});

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id || !UUID_RE.test(id)) return fail(404, 'Product not found');

  const parsed = await parseBody(req, adminProductSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const [doc] = await db
    .select({ id: products.id, images: products.images })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!doc) return fail(404, 'Product not found');
  const oldUrls = (doc.images ?? []).map((i) => i.url).filter(Boolean);

  if (!UUID_RE.test(input.category)) return fail(422, 'Selected category does not exist');
  const [category] = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, input.category))
    .limit(1);
  if (!category) return fail(422, 'Selected category does not exist');

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);

  const [clash] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(ne(products.id, doc.id), or(eq(products.slug, slug), eq(products.sku, input.sku))))
    .limit(1);
  if (clash) return fail(409, 'Another product already uses this slug or SKU');

  const images = (input.images ?? []).map((img) => ({
    url: img.url,
    alt: img.alt || input.name,
    isPrimary: img.isPrimary ?? false,
  }));
  if (images.length && !images.some((i) => i.isPrimary) && images[0]) {
    images[0].isPrimary = true;
  }

  const updated = takeOne(
    await db
      .update(products)
      .set({
        name: input.name,
        slug,
        shortDescription: input.shortDescription,
        description: input.description,
        categoryId: category.id,
        categorySlug: category.slug,
        categoryName: category.name,
        price: input.price,
        comparePrice: input.comparePrice,
        costPrice: input.costPrice,
        sku: input.sku,
        stock: input.stock,
        images,
        variants: (input.variants ?? []).map((v) => ({
          name: v.name,
          value: v.value,
          sku: v.sku,
          priceDelta: v.priceDelta ?? 0,
          stock: v.stock ?? 0,
        })),
        features: input.features,
        ingredients: input.ingredients,
        howToUse: input.howToUse,
        size: input.size,
        tags: input.tags,
        isFeatured: input.isFeatured,
        isBestSeller: input.isBestSeller,
        isNewArrival: input.isNewArrival,
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, doc.id))
      .returning({ id: products.id, slug: products.slug, name: products.name }),
  );

  await logAdminAction(admin, 'product.update', 'Product', String(updated.id), {
    name: updated.name,
  });

  // Clean up any images that were removed/replaced during the edit so they don't
  // linger as orphaned Cloudinary assets. Run after the write so the
  // still-referenced check sees the new image set.
  const newUrls = new Set(images.map((i) => i.url));
  const removed = oldUrls.filter((u) => !newUrls.has(u));
  if (removed.length) await purgeUnusedImages(removed);

  return ok({ id: String(updated.id), slug: updated.slug });
});

export const DELETE = handler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id || !UUID_RE.test(id)) return fail(404, 'Product not found');

  const [doc] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning({ id: products.id, name: products.name, images: products.images });
  if (!doc) return fail(404, 'Product not found');

  await logAdminAction(admin, 'product.delete', 'Product', id, {
    name: doc.name,
  });

  // Remove this product's now-orphaned images from Cloudinary (best-effort;
  // keeps any URL still referenced by another product).
  await purgeUnusedImages((doc.images ?? []).map((i) => i.url).filter(Boolean));

  return ok({ success: true });
});
