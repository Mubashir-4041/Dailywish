import 'server-only';
import {
  and,
  arrayOverlaps,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  count,
  type SQL,
} from 'drizzle-orm';
import { getDb } from '@/lib/db';
import {
  products as productsTable,
  categories as categoriesTable,
  testimonials as testimonialsTable,
  banners as bannersTable,
  type ProductRow,
} from '@/db/schema';
import {
  products as staticProducts,
  categories as staticCategories,
  testimonials as staticTestimonials,
  banners as staticBanners,
} from '@/data/catalog';
import type {
  Product,
  Category,
  Testimonial,
  Banner,
  Paginated,
} from '@/types';

export type SortKey =
  | 'featured'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'bestselling'
  | 'rating';

export interface ProductQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sort?: SortKey;
  page?: number;
  pageSize?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
}

function serializeProduct(doc: ProductRow): Product {
  return {
    _id: String(doc.id),
    name: doc.name,
    slug: doc.slug,
    shortDescription: doc.shortDescription ?? '',
    description: doc.description ?? '',
    category: doc.categorySlug,
    categoryName: doc.categoryName,
    brand: doc.brand ?? 'DailyWish',
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
    ingredients: doc.ingredients ?? undefined,
    howToUse: doc.howToUse ?? undefined,
    size: doc.size ?? undefined,
    tags: doc.tags ?? [],
    rating: doc.rating ?? 0,
    numReviews: doc.numReviews ?? 0,
    sold: doc.sold ?? 0,
    isFeatured: !!doc.isFeatured,
    isBestSeller: !!doc.isBestSeller,
    isNewArrival: !!doc.isNewArrival,
    isActive: doc.isActive !== false,
    seo: doc.seo ?? undefined,
    createdAt: new Date(doc.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(doc.updatedAt ?? Date.now()).toISOString(),
  };
}

// Hard ceiling for any single catalog query. The storefront must stay snappy:
// if the DB (or the Supabase pooler) stalls, we abandon the query well before
// the server-side statement_timeout and render the static catalog instead.
const CATALOG_QUERY_TIMEOUT_MS = 8_000;

async function withDb<T>(
  dbFn: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const query = dbFn();
    // If the timeout wins the race, `query` is abandoned but still pending; its
    // eventual rejection must be absorbed here or Node reports it as an
    // unhandled rejection.
    query.catch(() => {});
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`catalog query timed out after ${CATALOG_QUERY_TIMEOUT_MS}ms`)),
        CATALOG_QUERY_TIMEOUT_MS,
      );
    });
    return await Promise.race([query, timeout]);
  } catch (err) {
    // Graceful degradation: the catalog is read-only public data, so we always
    // fall back to the static catalog rather than crash the storefront. The
    // error is logged so production issues remain visible. (A query abandoned
    // here keeps running server-side but is capped by the role statement_timeout
    // and ignored — its late rejection is absorbed by instrumentation.ts.)
    // eslint-disable-next-line no-console
    console.error('[catalog] DB unavailable, using static fallback:', (err as Error).message);
    return fallback();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function sortComparator(sort: SortKey) {
  switch (sort) {
    case 'price-asc':
      return (a: Product, b: Product) => a.price - b.price;
    case 'price-desc':
      return (a: Product, b: Product) => b.price - a.price;
    case 'bestselling':
      return (a: Product, b: Product) => b.sold - a.sold;
    case 'rating':
      return (a: Product, b: Product) => b.rating - a.rating;
    case 'newest':
      return (a: Product, b: Product) =>
        +new Date(b.createdAt) - +new Date(a.createdAt);
    default:
      return (a: Product, b: Product) =>
        Number(b.isFeatured) - Number(a.isFeatured) || b.sold - a.sold;
  }
}

function pgOrderBy(sort: SortKey): SQL[] {
  switch (sort) {
    case 'price-asc':
      return [asc(productsTable.price)];
    case 'price-desc':
      return [desc(productsTable.price)];
    case 'bestselling':
      return [desc(productsTable.sold)];
    case 'rating':
      return [desc(productsTable.rating)];
    case 'newest':
      return [desc(productsTable.createdAt)];
    default:
      return [desc(productsTable.isFeatured), desc(productsTable.sold)];
  }
}

export async function getProducts(
  query: ProductQuery = {},
): Promise<Paginated<Product>> {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    tags,
    sort = 'featured',
    page = 1,
    pageSize = 12,
    featured,
    bestSeller,
    newArrival,
  } = query;

  return withDb(
    async () => {
      const db = getDb();
      const conditions: SQL[] = [eq(productsTable.isActive, true)];
      if (category) conditions.push(eq(productsTable.categorySlug, category));
      if (featured) conditions.push(eq(productsTable.isFeatured, true));
      if (bestSeller) conditions.push(eq(productsTable.isBestSeller, true));
      if (newArrival) conditions.push(eq(productsTable.isNewArrival, true));
      if (tags?.length) conditions.push(arrayOverlaps(productsTable.tags, tags));
      if (minPrice != null) conditions.push(gte(productsTable.price, minPrice));
      if (maxPrice != null) conditions.push(lte(productsTable.price, maxPrice));
      if (search) {
        const term = `%${search}%`;
        conditions.push(
          or(
            ilike(productsTable.name, term),
            ilike(productsTable.shortDescription, term),
          )!,
        );
      }
      const where = and(...conditions);

      const totalRows = await db
        .select({ value: count() })
        .from(productsTable)
        .where(where);
      const total = totalRows[0]?.value ?? 0;

      const docs = await db
        .select()
        .from(productsTable)
        .where(where)
        .orderBy(...pgOrderBy(sort))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return {
        data: docs.map(serializeProduct),
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
    () => {
      let list = staticProducts.filter((p) => p.isActive);
      if (category) list = list.filter((p) => p.category === category);
      if (featured) list = list.filter((p) => p.isFeatured);
      if (bestSeller) list = list.filter((p) => p.isBestSeller);
      if (newArrival) list = list.filter((p) => p.isNewArrival);
      if (tags?.length)
        list = list.filter((p) => p.tags.some((t) => tags.includes(t)));
      if (minPrice != null) list = list.filter((p) => p.price >= minPrice);
      if (maxPrice != null) list = list.filter((p) => p.price <= maxPrice);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q)),
        );
      }
      list = [...list].sort(sortComparator(sort));
      const total = list.length;
      const start = (page - 1) * pageSize;
      return {
        data: list.slice(start, start + pageSize),
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return withDb(
    async () => {
      const db = getDb();
      const [doc] = await db
        .select()
        .from(productsTable)
        .where(and(eq(productsTable.slug, slug), eq(productsTable.isActive, true)))
        .limit(1);
      return doc ? serializeProduct(doc) : null;
    },
    () => staticProducts.find((p) => p.slug === slug && p.isActive) ?? null,
  );
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const { data } = await getProducts({
    category: product.category,
    pageSize: limit + 1,
    sort: 'bestselling',
  });
  return data.filter((p) => p.slug !== product.slug).slice(0, limit);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { data } = await getProducts({ featured: true, pageSize: limit });
  return data;
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  const { data } = await getProducts({
    bestSeller: true,
    sort: 'bestselling',
    pageSize: limit,
  });
  return data;
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const { data } = await getProducts({
    newArrival: true,
    sort: 'newest',
    pageSize: limit,
  });
  return data;
}

export async function getAllProductSlugs(): Promise<string[]> {
  return withDb(
    async () => {
      const db = getDb();
      const docs = await db
        .select({ slug: productsTable.slug })
        .from(productsTable)
        .where(eq(productsTable.isActive, true));
      return docs.map((d) => d.slug);
    },
    () => staticProducts.filter((p) => p.isActive).map((p) => p.slug),
  );
}

export async function getCategories(): Promise<Category[]> {
  return withDb(
    async () => {
      const db = getDb();
      const docs = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.isActive, true))
        .orderBy(asc(categoriesTable.order));
      return docs.map((d) => ({
        _id: String(d.id),
        name: d.name,
        slug: d.slug,
        description: d.description ?? '',
        image: d.image ?? undefined,
        icon: d.icon ?? undefined,
        isActive: d.isActive !== false,
        order: d.order ?? 0,
      }));
    },
    () => staticCategories.filter((c) => c.isActive),
  );
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return withDb(
    async () => {
      const db = getDb();
      const docs = await db
        .select()
        .from(testimonialsTable)
        .where(eq(testimonialsTable.isActive, true))
        .orderBy(asc(testimonialsTable.order));
      return docs.map((d) => ({
        _id: String(d.id),
        name: d.name,
        role: d.role ?? undefined,
        avatar: d.avatar ?? undefined,
        rating: d.rating,
        quote: d.quote,
        isActive: d.isActive !== false,
        order: d.order ?? 0,
      }));
    },
    () => staticTestimonials.filter((t) => t.isActive),
  );
}

export async function getBanners(
  placement?: Banner['placement'],
): Promise<Banner[]> {
  return withDb(
    async () => {
      const db = getDb();
      const conditions: SQL[] = [eq(bannersTable.isActive, true)];
      if (placement) conditions.push(eq(bannersTable.placement, placement));
      const docs = await db
        .select()
        .from(bannersTable)
        .where(and(...conditions))
        .orderBy(asc(bannersTable.order));
      return docs.map((d) => ({
        _id: String(d.id),
        title: d.title,
        subtitle: d.subtitle ?? undefined,
        image: d.image,
        ctaLabel: d.ctaLabel ?? undefined,
        ctaHref: d.ctaHref ?? undefined,
        placement: d.placement,
        isActive: d.isActive !== false,
        order: d.order ?? 0,
      }));
    },
    () =>
      staticBanners.filter(
        (b) => b.isActive && (!placement || b.placement === placement),
      ),
  );
}
