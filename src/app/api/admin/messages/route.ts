import type { NextRequest } from 'next/server';
import { count, desc, eq } from 'drizzle-orm';
import { handler, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { contactMessages } from '@/db/schema';

export const runtime = 'nodejs';

export const GET = handler(async (req: NextRequest) => {
  await requireRole();
  const db = getDb();

  const filter = req.nextUrl.searchParams.get('filter');
  const where = filter === 'unread' ? eq(contactMessages.isRead, false) : undefined;

  const [rows, unreadRows] = await Promise.all([
    db
      .select()
      .from(contactMessages)
      .where(where)
      .orderBy(desc(contactMessages.createdAt))
      .limit(200),
    db
      .select({ value: count() })
      .from(contactMessages)
      .where(eq(contactMessages.isRead, false)),
  ]);

  return ok({
    data: rows.map((m) => ({
      _id: String(m.id),
      name: m.name,
      email: m.email,
      phone: m.phone ?? undefined,
      subject: m.subject,
      message: m.message,
      isRead: m.isRead,
      createdAt: new Date(m.createdAt).toISOString(),
    })),
    unread: unreadRows[0]?.value ?? 0,
  });
});
