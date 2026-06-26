import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductGrid } from '@/components/storefront/product-grid';
import { ShopToolbar, FilterControls } from '@/components/storefront/shop-filters';
import { Button } from '@/components/ui/button';
import { getProducts, getCategories, type SortKey } from '@/server/catalog';

export const metadata: Metadata = {
  title: 'Shop All Products',
  description:
    'Browse the full DailyWish range - Vitamin C face wash, serums, whitening creams, anti-acne care, skin polish and value bundles.',
  alternates: { canonical: '/shop' },
};

interface SearchParams {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ data, total, totalPages }, categories] = await Promise.all([
    getProducts({
      category: sp.category,
      search: sp.search,
      sort: (sp.sort as SortKey) ?? 'featured',
      minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
      page,
      pageSize: 12,
    }),
    getCategories(),
  ]);

  const activeCat = categories.find((c) => c.slug === sp.category);
  const heading = sp.search
    ? `Results for “${sp.search}”`
    : activeCat?.name ?? 'All Products';

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => v && k !== 'page' && params.set(k, v));
    params.set('page', String(p));
    return `/shop?${params.toString()}`;
  };

  return (
    <div className="container py-8">
      {/* Breadcrumb + heading */}
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link> /{' '}
        <span className="text-foreground">Shop</span>
        {activeCat && <> / <span className="text-foreground">{activeCat.name}</span></>}
      </nav>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {heading}
      </h1>
      {activeCat?.description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{activeCat.description}</p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterControls categories={categories} />
          </div>
        </aside>

        <div>
          <ShopToolbar categories={categories} total={total} />
          <div className="mt-6">
            <ProductGrid products={data} />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? <Link href={buildPageHref(page - 1)}>Previous</Link> : <span>Previous</span>}
              </Button>
              <span className="px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? <Link href={buildPageHref(page + 1)}>Next</Link> : <span>Next</span>}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
