import type { NextRequest } from 'next/server';
import { handler, ok } from '@/lib/api';
import { getProducts, type SortKey } from '@/server/catalog';

export const runtime = 'nodejs';

export const GET = handler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const result = await getProducts({
    category: sp.get('category') ?? undefined,
    search: sp.get('search') ?? undefined,
    minPrice: sp.get('minPrice') ? Number(sp.get('minPrice')) : undefined,
    maxPrice: sp.get('maxPrice') ? Number(sp.get('maxPrice')) : undefined,
    sort: (sp.get('sort') as SortKey) ?? 'featured',
    page: sp.get('page') ? Number(sp.get('page')) : 1,
    pageSize: sp.get('pageSize') ? Number(sp.get('pageSize')) : 12,
    featured: sp.get('featured') === 'true' || undefined,
    bestSeller: sp.get('bestSeller') === 'true' || undefined,
    newArrival: sp.get('newArrival') === 'true' || undefined,
  });
  return ok(result);
});
