import { handler, ok } from '@/lib/api';
import { clearSession } from '@/lib/auth';

export const runtime = 'nodejs';

export const POST = handler(async () => {
  await clearSession();
  return ok({ success: true });
});
