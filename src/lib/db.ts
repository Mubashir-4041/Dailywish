import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

/**
 * Cached Drizzle/postgres-js connection for serverless / hot-reload
 * environments. Prevents exhausting the Supabase connection pool across
 * module reloads.
 */
type Db = PostgresJsDatabase<typeof schema>;

interface DbCache {
  client: ReturnType<typeof postgres> | null;
  db: Db | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _drizzle: DbCache | undefined;
}

const cached: DbCache = global._drizzle ?? { client: null, db: null };
global._drizzle = cached;

export class DatabaseUnavailableError extends Error {
  constructor(message = 'DATABASE_URL is not configured') {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

function connect(): Db {
  if (cached.db) return cached.db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseUnavailableError();

  const client = postgres(url, {
    // Use the Supabase SESSION pooler (port 5432) for this long-lived server —
    // the transaction pooler (6543) drops/rotates backends underneath a
    // persistent pool and causes dead-socket hangs. `prepare: false` is kept as
    // a safe default (also required if anyone points this at the 6543 pooler).
    prepare: false,
    // Keep the pool small for the pooler; more than this just queues anyway.
    max: 5,
    // Proactively recycle connections so we never reuse one the pooler/network
    // has silently dropped (the cause of multi-second/minute query hangs):
    // close idle connections after 20s, rotate any connection after 30 min,
    // and fail fast (10s) if a brand-new connection can't be established.
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
  });
  cached.client = client;
  cached.db = drizzle(client, { schema });
  return cached.db;
}

/**
 * Return the Drizzle DB handle. Throws DatabaseUnavailableError when no
 * DATABASE_URL is set - callers may catch this to fall back to the static
 * catalog in dev.
 */
export function getDb(): Db {
  return connect();
}

/**
 * Compatibility wrapper for call sites that previously did `await dbConnect()`
 * before using a model. Returns the Drizzle DB handle.
 */
export async function dbConnect(): Promise<Db> {
  return connect();
}

/** True when a database connection is configured & reachable. */
export async function isDbReady(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const db = connect();
    await db.execute('select 1');
    return true;
  } catch {
    return false;
  }
}

export { schema };
