import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { handler, parseBody, ok } from '@/lib/api';
import { confirmStripeOrder } from '@/server/payments';

export const runtime = 'nodejs';

const confirmSchema = z.object({
  orderNumber: z.string().trim().min(1).max(64),
  paymentIntentId: z.string().trim().min(1).max(128),
});

/**
 * Called by the success page when the customer returns from Stripe. We DON'T
 * trust the browser's `redirect_status`; this re-retrieves the PaymentIntent
 * from Stripe, confirms it belongs to the order (via metadata) and marks the
 * order paid. Idempotent and safe to call repeatedly. The webhook remains the
 * primary/authoritative path; this just makes settlement work without one.
 */
export const POST = handler(async (req: NextRequest) => {
  const parsed = await parseBody(req, confirmSchema);
  if ('response' in parsed) return parsed.response;
  const { orderNumber, paymentIntentId } = parsed.data;

  const result = await confirmStripeOrder(orderNumber, paymentIntentId);
  return ok(result);
});
