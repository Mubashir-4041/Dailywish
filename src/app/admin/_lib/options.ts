import 'server-only';
import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { categories } from '@/db/schema';
import { categories as staticCategories, products as staticProducts } from '@/data/catalog';

export interface CategoryOption {
  _id: string;
  name: string;
}

/** Categories for select inputs, with a static fallback when no DB. */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  if (!process.env.DATABASE_URL) {
    return staticCategories.map((c) => ({ _id: c._id, name: c.name }));
  }
  try {
    const db = getDb();
    const docs = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.order), asc(categories.name));
    return docs.map((d) => ({ _id: String(d.id), name: d.name }));
  } catch {
    return staticCategories.map((c) => ({ _id: c._id, name: c.name }));
  }
}

/** A flat, de-duplicated list of known product image paths for the picker. */
export function getImagePicker(): string[] {
  const urls = new Set<string>();
  for (const p of staticProducts) {
    for (const img of p.images) urls.add(img.url);
  }
  return [...urls];
}
