/**
 * Migrate all local content images (public/products, public/banners,
 * public/testimonials) to Cloudinary and repoint every reference:
 *   1. Upload each file (idempotent — deterministic public_id, overwrite).
 *   2. Update existing Postgres rows (products, banners, categories,
 *      testimonials) so the live site serves Cloudinary URLs.
 *   3. Rewrite src/data/catalog.ts so future `npm run seed` runs stay on
 *      Cloudinary too.
 *
 * Local files under /public are left in place as a fallback. Brand assets
 * (logo, favicon, icons) intentionally stay local.
 *
 * Usage:  npm run migrate:images
 * Requires CLOUDINARY_* in .env.local. DATABASE_URL is optional (DB step is
 * skipped when absent).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const { products, banners, categories, testimonials } = schema;

const IMAGE_EXTS = new Set(['.jpeg', '.jpg', '.png', '.webp', '.avif', '.gif']);
// public sub-dir → cloudinary folder + the URL prefix used in code/DB.
const FOLDERS = [
  { dir: 'products', urlPrefix: '/products' },
  { dir: 'banners', urlPrefix: '/banners' },
  { dir: 'testimonials', urlPrefix: '/testimonials' },
];

const MIME: Record<string, string> = {
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
};

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('❌ Missing CLOUDINARY_* env vars in .env.local');
    process.exit(1);
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Upload every image and return a map of local URL → Cloudinary URL. */
async function uploadAll(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const { dir, urlPrefix } of FOLDERS) {
    const abs = join(process.cwd(), 'public', dir);
    if (!existsSync(abs)) {
      console.log(`· skipping public/${dir} (not found)`);
      continue;
    }
    const files = readdirSync(abs).filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()));
    console.log(`\n📁 public/${dir} — ${files.length} image(s)`);
    for (const file of files) {
      const ext = extname(file).toLowerCase();
      const name = basename(file, ext);
      const localUrl = `${urlPrefix}/${file}`;
      const buffer = readFileSync(join(abs, file));
      const dataUri = `data:${MIME[ext] ?? 'image/jpeg'};base64,${buffer.toString('base64')}`;
      const res = await cloudinary.uploader.upload(dataUri, {
        folder: `dailywish/${dir}`,
        public_id: name,
        overwrite: true,
        resource_type: 'image',
      });
      map[localUrl] = res.secure_url;
      console.log(`  ✅ ${localUrl} → ${res.secure_url}`);
    }
  }
  return map;
}

async function updateDatabase(map: Record<string, string>) {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.log('\n⚠️  DATABASE_URL not set — skipping DB update.');
    return;
  }
  console.log('\n🔌 Connecting to Postgres…');
  const client = postgres(uri, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  const remap = (url?: string | null) => (url && map[url] ? map[url] : url);

  const counts = { products: 0, banners: 0, categories: 0, testimonials: 0 };

  try {
    const productRows = await db.select().from(products);
    for (const p of productRows) {
      let touched = false;
      const nextImages = (p.images ?? []).map((img) => {
        const next = remap(img.url);
        if (next && next !== img.url) {
          touched = true;
          return { ...img, url: next };
        }
        return img;
      });
      if (touched) {
        await db.update(products).set({ images: nextImages }).where(eq(products.id, p.id));
        counts.products += 1;
      }
    }

    const bannerRows = await db.select().from(banners);
    for (const b of bannerRows) {
      const next = remap(b.image);
      if (next && next !== b.image) {
        await db.update(banners).set({ image: next }).where(eq(banners.id, b.id));
        counts.banners += 1;
      }
    }

    const catRows = await db.select().from(categories);
    for (const c of catRows) {
      const next = remap(c.image);
      if (next && next !== c.image) {
        await db.update(categories).set({ image: next }).where(eq(categories.id, c.id));
        counts.categories += 1;
      }
    }

    const tsRows = await db.select().from(testimonials);
    for (const t of tsRows) {
      const next = remap(t.avatar);
      if (next && next !== t.avatar) {
        await db.update(testimonials).set({ avatar: next }).where(eq(testimonials.id, t.id));
        counts.testimonials += 1;
      }
    }
  } finally {
    await client.end();
  }

  console.log(
    `✅ DB updated — products: ${counts.products}, banners: ${counts.banners}, categories: ${counts.categories}, testimonials: ${counts.testimonials}`,
  );
}

function rewriteCatalog(map: Record<string, string>) {
  const file = join(process.cwd(), 'src', 'data', 'catalog.ts');
  if (!existsSync(file)) {
    console.log('\n⚠️  src/data/catalog.ts not found — skipping seed-source rewrite.');
    return;
  }
  let src = readFileSync(file, 'utf8');
  let replaced = 0;
  for (const [localUrl, cloudUrl] of Object.entries(map)) {
    if (src.includes(localUrl)) {
      src = src.split(localUrl).join(cloudUrl);
      replaced += 1;
    }
  }
  writeFileSync(file, src);
  console.log(`\n✅ Rewrote ${replaced} image path(s) in src/data/catalog.ts`);
}

async function main() {
  configureCloudinary();
  console.log('🚀 Migrating local images to Cloudinary…');
  const map = await uploadAll();

  const mapPath = join(process.cwd(), 'scripts', 'cloudinary-map.json');
  writeFileSync(mapPath, JSON.stringify(map, null, 2));
  console.log(`\n🗺️  Map saved → ${mapPath} (${Object.keys(map).length} images)`);

  try {
    await updateDatabase(map);
  } catch (e) {
    console.warn(
      '⚠️  DB update skipped/failed (is the database reachable?):',
      e instanceof Error ? e.message : e,
    );
  }
  rewriteCatalog(map);

  console.log('\n🎉 Done. Local /public files were left in place as a fallback.');
}

main().catch((e) => {
  console.error('❌ Migration failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
