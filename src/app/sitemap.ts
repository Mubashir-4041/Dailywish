import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getAllProductSlugs, getCategories } from '@/server/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes = [
    '',
    '/shop',
    '/categories',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms',
    '/return-policy',
    '/login',
    '/register',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  const [slugs, categories] = await Promise.all([
    getAllProductSlugs(),
    getCategories(),
  ]);

  const productRoutes = slugs.map((slug) => ({
    url: `${base}/product/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${base}/shop?category=${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
