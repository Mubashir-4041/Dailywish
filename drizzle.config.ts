import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config. Migrations are emitted into `supabase/migrations` so they
 * are applied by the Supabase CLI (`supabase db push` / `supabase migration up`)
 * alongside any SQL written by hand.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
