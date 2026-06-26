import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { products } from '@/db/schema';
import { deleteImagesByUrl } from '@/lib/cloudinary';

/**
 * Delete the given image URLs from Cloudinary, but KEEP any that are still
 * referenced by a product (shared assets must not be yanked out from under a
 * sibling product). Best-effort and never throws — image cleanup must never
 * block the product write that triggered it.
 *
 * Callers must run this AFTER the product row has been written, so the
 * "still referenced" check reflects the final state of the catalog.
 */
export async function purgeUnusedImages(urls: string[]): Promise<void> {
  const candidates = [...new Set(urls.filter(Boolean))];
  if (!candidates.length) return;
  try {
    const db = getDb();
    const stillUsed = (await db.execute(sql`
      select distinct img->>'url' as url
      from ${products}, jsonb_array_elements(${products.images}) as img
      where img->>'url' in ${candidates}
    `)) as unknown as { url: string }[];
    const usedSet = new Set(stillUsed.map((r) => r.url));
    const toDelete = candidates.filter((u) => !usedSet.has(u));
    if (toDelete.length) await deleteImagesByUrl(toDelete);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[media] orphan image purge skipped:', (err as Error).message);
  }
}
