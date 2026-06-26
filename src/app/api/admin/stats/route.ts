import { handler, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getAdminStats } from '@/app/admin/_lib/stats';

export const runtime = 'nodejs';

export const GET = handler(async () => {
  await requireRole();
  const stats = await getAdminStats();
  return ok(stats);
});
