/**
 * One-off, idempotent setup for the manual-wallet payments feature + the two
 * content fixes from the audit. Safe to run more than once.
 *
 *   npx tsx scripts/apply-payment-setup.ts
 *
 * It:
 *   1. adds the orders.payment_proof_url column (screenshot URL)         [schema]
 *   2. seeds the editable Easypaisa / JazzCash wallet numbers            [data]
 *   3. fixes the garbled apostrophe in the announcement bar              [data]
 *   4. removes two dead Cloudinary image URLs off the skin-polish product [data]
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import postgres from 'postgres';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 15 });

  // 1. Additive, idempotent column for the payment screenshot URL.
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url text`;
  console.log('✓ orders.payment_proof_url ensured');

  // 2. Seed editable wallet settings (owner can change these in Admin → Settings).
  const upsert = (key: string, value: string) =>
    sql`insert into settings (key, value, "group") values (${key}, ${JSON.stringify(value)}::jsonb, 'general')
        on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await upsert('easypaisaNumber', '03135119536');
  await upsert('easypaisaName', 'Kashif Ali');
  await upsert('jazzcashNumber', '03135119536');
  await upsert('jazzcashName', 'Kashif Ali');
  console.log('✓ wallet settings seeded (Easypaisa/JazzCash 03135119536, Kashif Ali)');

  // 3. Fix the mojibake apostrophe in the announcement bar.
  const goodAnnouncement =
    'We know you love a good deal, so we’re making your shopping experience even sweeter. Spend PKR 3,000 or more and your shipping is exactly Zero.';
  await sql`insert into settings (key, value, "group") values ('announcement', ${JSON.stringify(goodAnnouncement)}::jsonb, 'general')
        on conflict (key) do update set value = excluded.value, updated_at = now()`;
  console.log('✓ announcement text fixed (proper apostrophe)');

  // 4. Strip the two dead Cloudinary URLs off the skin-polish product so it
  //    stops throwing 404s (it now shows the branded placeholder until real
  //    photos are uploaded).
  const [p] = await sql`select id, images from products where slug = 'daily-wish-skin-polish'`;
  if (p) {
    const cleaned = ((p.images as { url: string }[]) ?? []).filter(
      (i) => !String(i.url).includes('/skinpolish-'),
    );
    await sql`update products set images = ${JSON.stringify(cleaned)}::jsonb where id = ${p.id}`;
    console.log(`✓ skin-polish dead images removed (${(p.images as unknown[])?.length ?? 0} -> ${cleaned.length})`);
  }

  await sql.end();
  console.log('\nDone.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
