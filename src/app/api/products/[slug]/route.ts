import type { NextRequest } from 'next/server';
import { handler, ok, fail } from '@/lib/api';
import { getProductBySlug } from '@/server/catalog';

export const runtime = 'nodejs';

export const GET = handler(
  async (_req: NextRequest, ctx: { params?: Promise<Record<string, string>> }) => {
    const params = ctx.params ? await ctx.params : {};
    const product = await getProductBySlug(params.slug!);
    if (!product) return fail(404, 'Product not found');
    return ok({ product });
  },
);
