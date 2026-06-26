/**
 * Create or promote a user to admin.
 * Usage: npm run create-admin -- <email> <password> [super_admin|admin]
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';

async function main() {
  const [, , emailArg, passwordArg, roleArg] = process.argv;
  const email = (emailArg ?? process.env.ADMIN_EMAIL ?? '').toLowerCase();
  const password = passwordArg ?? process.env.ADMIN_PASSWORD ?? '';
  const role = (roleArg as 'super_admin' | 'admin') ?? 'admin';

  if (!email || !password) {
    console.error('Usage: npm run create-admin -- <email> <password> [role]');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(schema.users)
    .values({
      name: 'DailyWish Admin',
      email,
      passwordHash,
      role,
      isEmailVerified: true,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { role, passwordHash, isEmailVerified: true, isActive: true },
    })
    .returning({ email: schema.users.email, role: schema.users.role });

  console.log(`✅ ${user!.email} is now ${user!.role}.`);
  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
