/**
 * Apply the generated SQL migrations to the database using the same
 * postgres.js connection the seed script uses (works with the Supabase
 * transaction pooler, prepare:false). Surfaces the real connection error
 * that drizzle-kit hides behind its spinner.
 *
 * Usage: tsx scripts/db-apply.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }
  // Mask the password when echoing the target.
  console.log('🔌 Connecting to:', url.replace(/:[^:@/]+@/, ':****@'));

  const client = postgres(url, { prepare: false, max: 1 });

  try {
    const rows = await client<{ now: Date }[]>`select now()`;
    console.log('✅ Connected. Server time:', rows[0]?.now);

    const dir = join('supabase', 'migrations');
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    console.log(`📦 Applying ${files.length} migration file(s): ${files.join(', ')}`);

    for (const file of files) {
      const sql = readFileSync(join(dir, file), 'utf8');
      // The whole file is valid SQL (drizzle's `--> statement-breakpoint`
      // lines are `--` comments); run via the simple-query protocol.
      await client.unsafe(sql);
      console.log(`   ✔ ${file}`);
    }

    console.log('🎉 Schema applied.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
