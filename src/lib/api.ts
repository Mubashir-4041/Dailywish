import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { AuthError } from '@/lib/auth';
import { DatabaseUnavailableError } from '@/lib/db';
import { rateLimit, type RateLimitResult } from '@/lib/rate-limit';

/**
 * Take the single row from a Drizzle `.returning()` / single-row query result.
 * Throws (→ 500 via {@link handler}) if the array is empty, which should never
 * happen for an INSERT or for an UPDATE/DELETE guarded by a prior existence
 * check. Lets call sites use the row without TS `| undefined` noise.
 */
export function takeOne<T>(rows: T[]): T {
  const row = rows[0];
  if (!row) throw new Error('Expected at least one row from the database');
  return row;
}

/** Standard JSON success response. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function fail(
  status: number,
  error: string,
  details?: Record<string, string[] | undefined>,
) {
  return NextResponse.json({ error, details }, { status });
}

/** Best-effort client IP extraction behind proxies. */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

/**
 * Recursively strip MongoDB operator keys ($, .) from untrusted input to
 * prevent NoSQL injection / query operator smuggling.
 */
export function sanitize<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((v) => sanitize(v)) as unknown as T;
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = sanitize(v);
    }
    return out as T;
  }
  return input;
}

/** Apply a rate limit and return a 429 response when exceeded (else null). */
export function enforceRateLimit(
  req: NextRequest,
  scope: string,
  opts?: { limit?: number; windowMs?: number },
): NextResponse | null {
  const ip = getClientIp(req);
  const result: RateLimitResult = rateLimit(`${scope}:${ip}`, opts);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
        },
      },
    );
  }
  return null;
}

/**
 * Flatten a ZodError into `{ path: [messages] }`. Unlike `error.flatten()`,
 * this keeps errors nested inside arrays/objects (e.g. `variants.0.sku`) instead
 * of dropping them, so the client can always name the offending field.
 */
export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_root';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Parse + validate a JSON body against a Zod schema (with sanitization). */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { response: fail(400, 'Invalid JSON body') };
  }
  const result = schema.safeParse(sanitize(raw));
  if (!result.success) {
    return {
      response: fail(422, 'Validation failed', zodFieldErrors(result.error)),
    };
  }
  return { data: result.data };
}

/** Wrap a route handler with consistent error handling. */
export function handler(
  fn: (req: NextRequest, ctx: { params?: Promise<Record<string, string>> }) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    ctx: { params?: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof AuthError) return fail(err.status, err.message);
      if (err instanceof ZodError) {
        return fail(422, 'Validation failed', zodFieldErrors(err));
      }
      if (err instanceof DatabaseUnavailableError) {
        return fail(503, 'This feature requires a database connection. Configure DATABASE_URL.');
      }
      // eslint-disable-next-line no-console
      console.error('[api] Unhandled error:', err);
      return fail(500, 'Something went wrong. Please try again later.');
    }
  };
}
