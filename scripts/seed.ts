/**
 * Seed Supabase Postgres with the canonical DailyWish catalog + a bootstrap admin.
 *
 * Usage:  npm run seed
 * Requires DATABASE_URL in .env.local
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { categories as catData, products as productData, testimonials as testimonialData, banners as bannerData } from '../src/data/catalog';
import * as schema from '../src/db/schema';

const {
  categories,
  products,
  testimonials,
  banners,
  coupons,
  users,
  reviews,
} = schema;

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('❌ DATABASE_URL is not set. Add it to .env.local first.');
    process.exit(1);
  }

  console.log('🔌 Connecting to Postgres…');
  const client = postgres(uri, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });
  console.log('✅ Connected.');

  // ── Reset ──────────────────────────────────────────────
  // Order matters: reviews → products → categories (FK dependencies).
  console.log('🧹 Clearing existing catalog tables…');
  await db.delete(reviews);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(testimonials);
  await db.delete(banners);
  await db.delete(coupons);

  // ── Categories ─────────────────────────────────────────
  const slugToId = new Map<string, string>();
  for (const c of catData) {
    const [row] = await db
      .insert(categories)
      .values({
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        icon: c.icon,
        isActive: c.isActive,
        order: c.order,
      })
      .returning({ id: categories.id });
    slugToId.set(c.slug, row!.id);
  }
  console.log(`📁 Inserted ${catData.length} categories.`);

  // ── Products ───────────────────────────────────────────
  let productCount = 0;
  const insertedProducts: { id: string; name: string }[] = [];
  for (const pr of productData) {
    const categoryId = slugToId.get(pr.category);
    if (!categoryId) {
      console.warn(`⚠️  Skipping ${pr.name}: unknown category ${pr.category}`);
      continue;
    }
    const [row] = await db
      .insert(products)
      .values({
        name: pr.name,
        slug: pr.slug,
        shortDescription: pr.shortDescription,
        description: pr.description,
        categoryId,
        categorySlug: pr.category,
        categoryName: pr.categoryName,
        brand: pr.brand,
        price: pr.price,
        comparePrice: pr.comparePrice,
        costPrice: pr.costPrice,
        sku: pr.sku,
        stock: pr.stock,
        images: pr.images.map((i) => ({ url: i.url, alt: i.alt, isPrimary: !!i.isPrimary })),
        variants: pr.variants,
        features: pr.features,
        ingredients: pr.ingredients,
        howToUse: pr.howToUse,
        size: pr.size,
        tags: pr.tags,
        rating: pr.rating,
        numReviews: pr.numReviews,
        sold: pr.sold,
        isFeatured: pr.isFeatured,
        isBestSeller: pr.isBestSeller,
        isNewArrival: pr.isNewArrival,
        isActive: pr.isActive,
        seo: pr.seo,
      })
      .returning({ id: products.id });
    insertedProducts.push({ id: row!.id, name: pr.name });
    productCount++;
  }
  console.log(`🧴 Inserted ${productCount} products.`);

  // ── Testimonials & Banners ─────────────────────────────
  await db.insert(testimonials).values(
    testimonialData.map((t) => ({
      name: t.name,
      role: t.role,
      avatar: t.avatar,
      rating: t.rating,
      quote: t.quote,
      isActive: t.isActive,
      order: t.order,
    })),
  );
  await db.insert(banners).values(
    bannerData.map((b) => ({
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
      ctaLabel: b.ctaLabel,
      ctaHref: b.ctaHref,
      placement: b.placement,
      isActive: b.isActive,
      order: b.order,
    })),
  );
  console.log(`💬 Inserted ${testimonialData.length} testimonials & ${bannerData.length} banners.`);

  // ── Coupons ────────────────────────────────────────────
  // Coupons intentionally not seeded (coupon feature removed from the storefront).
  // The `coupons` table is left empty; admins can still create coupons later.

  // ── Sample approved reviews on the flagship product ────
  const flagship = insertedProducts.find((p) => p.name.includes('Face Wash'));
  if (flagship) {
    await db.insert(reviews).values([
      {
        productId: flagship.id,
        name: 'Mehwish A.',
        rating: 5,
        title: 'Best face wash I have used',
        comment:
          'My skin feels so clean and bright after every wash. The beads are gentle and it smells amazing.',
        isApproved: true,
        isVerifiedPurchase: true,
      },
      {
        productId: flagship.id,
        name: 'Bilal K.',
        rating: 4,
        title: 'Good for oily skin',
        comment: 'Controls oil really well and does not dry out my face. Will reorder.',
        isApproved: true,
        isVerifiedPurchase: true,
      },
    ]);
    console.log('⭐ Inserted sample reviews.');
  }

  // ── Bootstrap admin ────────────────────────────────────
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@dailywish.pk').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@12345';
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.insert(users).values({
      name: 'DailyWish Admin',
      email: adminEmail,
      passwordHash,
      role: 'super_admin',
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`👑 Created super admin: ${adminEmail}`);
  } else {
    console.log(`👑 Admin already exists: ${adminEmail}`);
  }

  // Demo customer
  const custEmail = 'customer@dailywish.pk';
  const [existingCust] = await db.select({ id: users.id }).from(users).where(eq(users.email, custEmail)).limit(1);
  if (!existingCust) {
    await db.insert(users).values({
      name: 'Demo Customer',
      email: custEmail,
      passwordHash: await bcrypt.hash('Customer@123', 12),
      role: 'customer',
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`🧑 Created demo customer: ${custEmail} / Customer@123`);
  }

  console.log('\n🎉 Seed complete!');
  await client.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
