import 'server-only';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db';
import { auditLogs } from '@/db/schema';
import type { SessionUser } from '@/lib/auth';

/** Record a privileged admin action. Never throws - logging must not break flows. */
export async function logAdminAction(
  actor: SessionUser,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const db = getDb();
    const h = await headers();
    await db.insert(auditLogs).values({
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      entity,
      entityId,
      ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null,
      userAgent: h.get('user-agent') ?? null,
      metadata,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to record action:', (err as Error).message);
  }
}
