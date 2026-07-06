import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getProducts, getCategories } from '@/server/catalog';

const BASE = siteConfig.url;

/** Sitemap image URLs must be absolute; Cloudinary URLs already are, local ones aren't. */
function absolute(url: string): string {
  return url.startsWith('http') ? url : `${BASE}${url}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Public, indexable content pages only. Auth pages (/login, /register) are
  // intentionally excluded — they carry no SEO value and shouldn't be listed.
  const staticRoutes = [
    '',
    '/shop',
    '/categories',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms',
    '/return-policy',
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  const [{ data: products }, categories] = await Promise.all([
    getProducts({ pageSize: 1000 }),
    getCategories(),
  ]);

  // Product pages carry their images so photos are eligible for Google Images.
  const productRoutes = products.map((p) => ({
    url: `${BASE}/product/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
    images: p.images.map((i) => absolute(i.url)),
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${BASE}/shop?category=${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
