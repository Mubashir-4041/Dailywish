import { handler, ok } from '@/lib/api';
import { getCategories } from '@/server/catalog';

export const runtime = 'nodejs';

export const GET = handler(async () => {
  const categories = await getCategories();
  return ok({ categories });
});
