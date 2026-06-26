import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { handler, parseBody, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { settings } from '@/db/schema';
import { logAdminAction } from '@/server/audit';

export const runtime = 'nodejs';

const settingsSchema = z.object({
  announcement: z.string().trim().max(200).optional().or(z.literal('')),
  freeShippingThreshold: z.coerce.number().min(0).optional(),
  facebook: z.string().trim().max(200).optional().or(z.literal('')),
  instagram: z.string().trim().max(200).optional().or(z.literal('')),
  tiktok: z.string().trim().max(200).optional().or(z.literal('')),
  youtube: z.string().trim().max(200).optional().or(z.literal('')),
});

export const GET = handler(async () => {
  await requireRole();
  const db = getDb();

  const docs = await db.select().from(settings).where(eq(settings.group, 'general'));
  const map: Record<string, unknown> = {};
  for (const d of docs) map[d.key] = d.value;

  return ok({ data: map });
});

export const PUT = handler(async (req: NextRequest) => {
  const admin = await requireRole();
  const db = getDb();

  const parsed = await parseBody(req, settingsSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  const entries = Object.entries(input).filter(([, v]) => v !== undefined);
  await Promise.all(
    entries.map(([key, value]) =>
      db
        .insert(settings)
        .values({ key, value, group: 'general' })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, group: 'general', updatedAt: new Date() },
        }),
    ),
  );

  await logAdminAction(admin, 'settings.update', 'Setting', undefined, {
    keys: entries.map(([k]) => k),
  });

  return ok({ success: true });
});
