import { handler, ok } from '@/lib/api';
import { getSiteSettings } from '@/server/settings';

export const runtime = 'nodejs';

/**
 * Public: the mobile-wallet numbers customers pay to (Easypaisa / JazzCash).
 * These are meant to be shown at checkout, so no auth is required. The values
 * are owner-editable in Admin → Settings (with a config fallback).
 */
export const GET = handler(async () => {
  const settings = await getSiteSettings();
  return ok({ payments: settings.payments });
});
