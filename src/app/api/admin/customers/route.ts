import type { NextRequest } from 'next/server';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { handler, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import type { Role } from '@/types';

export const runtime = 'nodejs';

/** Escape LIKE wildcards so user input can't broaden the match (ReDoS-free). */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export const GET = handler(async (req: NextRequest) => {
  await requireRole();
  const db = getDb();

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? '20') || 20));
  const search = sp.get('search')?.trim();
  const role = sp.get('role')?.trim();

  const conditions: SQL[] = [];
  if (role) conditions.push(eq(users.role, role as Role));
  if (search) {
    const term = `%${likeEscape(search)}%`;
    conditions.push(or(ilike(users.name, term), ilike(users.email, term))!);
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [docs, totalRows] = await Promise.all([
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(users).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  return ok({
    data: docs.map((d) => ({
      _id: String(d.id),
      name: d.name,
      email: d.email,
      role: d.role,
      phone: d.phone ?? '',
      isActive: d.isActive !== false,
      isEmailVerified: !!d.isEmailVerified,
      lastLoginAt: d.lastLoginAt ? new Date(d.lastLoginAt).toISOString() : null,
      createdAt: new Date(d.createdAt ?? Date.now()).toISOString(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});
