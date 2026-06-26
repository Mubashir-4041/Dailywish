import type { NextRequest } from 'next/server';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { handler, parseBody, ok, created, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { adminProductSchema } from '@/lib/validations';
import { products, categories } from '@/db/schema';
import { logAdminAction } from '@/server/audit';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Escape LIKE wildcards so user input can't broaden the match (ReDoS-free). */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export const GET = handler(async (req: NextRequest) => {
  await requireRole();
  const db = getDb();

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? '20') || 20));
  const search = sp.get('search')?.trim();
  const category = sp.get('category')?.trim();

  const conditions: SQL[] = [];
  if (search) {
    const term = `%${likeEscape(search)}%`;
    conditions.push(or(ilike(products.name, term), ilike(products.sku, term))!);
  }
  if (category) conditions.push(eq(products.categorySlug, category));
  const where = conditions.length ? and(...conditions) : undefined;

  const [docs, totalRows] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(products).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  return ok({
    data: docs.map((d) => ({
      _id: String(d.id),
      name: d.name,
      slug: d.slug,
      sku: d.sku,
      price: d.price,
      comparePrice: d.comparePrice ?? null,
      stock: d.stock ?? 0,
      categoryName: d.categoryName,
      categorySlug: d.categorySlug,
      image: d.images?.[0]?.url ?? '',
      isActive: d.isActive !== false,
      isFeatured: !!d.isFeatured,
      sold: d.sold ?? 0,
      createdAt: new Date(d.createdAt ?? Date.now()).toISOString(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

export const POST = handler(async (req: NextRequest) => {
  const admin = await requireRole();
  const db = getDb();

  const parsed = await parseBody(req, adminProductSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  if (!UUID_RE.test(input.category)) return fail(422, 'Selected category does not exist');
  const [category] = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, input.category))
    .limit(1);
  if (!category) return fail(422, 'Selected category does not exist');

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);

  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(or(eq(products.slug, slug), eq(products.sku, input.sku)))
    .limit(1);
  if (existing) return fail(409, 'A product with this slug or SKU already exists');

  const inputImages = input.images ?? [];
  const images = inputImages.length
    ? inputImages.map((img, i) => ({
        url: img.url,
        alt: img.alt || input.name,
        isPrimary: img.isPrimary ?? i === 0,
      }))
    : [];
  if (images.length && !images.some((i) => i.isPrimary) && images[0]) {
    images[0].isPrimary = true;
  }

  const doc = takeOne(
    await db
      .insert(products)
      .values({
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
      })
      .returning({ id: products.id, slug: products.slug, name: products.name }),
  );

  await logAdminAction(admin, 'product.create', 'Product', String(doc.id), {
    name: doc.name,
  });

  return created({ id: String(doc.id), slug: doc.slug });
});
