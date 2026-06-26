import type { NextRequest } from 'next/server';
import { count, desc } from 'drizzle-orm';
import { handler, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { auditLogs } from '@/db/schema';

export const runtime = 'nodejs';

export const GET = handler(async (req: NextRequest) => {
  await requireRole();
  const db = getDb();

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? '30') || 30));

  const [docs, totalRows] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(auditLogs),
  ]);
  const total = totalRows[0]?.value ?? 0;

  return ok({
    data: docs.map((d) => ({
      _id: String(d.id),
      actorEmail: d.actorEmail,
      action: d.action,
      entity: d.entity,
      entityId: d.entityId ?? '',
      ip: d.ip ?? '',
      metadata: d.metadata ?? {},
      createdAt: new Date(d.createdAt ?? Date.now()).toISOString(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});
