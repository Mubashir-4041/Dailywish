import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { orders, products, coupons } from '@/db/schema';
import type { PaymentStatus } from '@/types';

/**
 * Server-side payment reconciliation. This is the ONLY place an order's
 * payment status is flipped to `paid` — called from both the Stripe webhook
 * (authoritative, production) and the return-from-Stripe confirm endpoint
 * (so card payments also settle in local dev without a webhook). Both paths
 * are idempotent: a second call on an already-paid order is a no-op.
 */

async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  const Stripe = (await import('stripe')).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

interface MarkResult {
  ok: boolean;
  alreadyPaid?: boolean;
  reason?: 'not_found';
}

/**
 * Idempotently mark an order paid + move it to `confirmed`, and — for online
 * payments — commit inventory (stock/sold + coupon usage) NOW. Online orders
 * deliberately defer the stock commit from checkout to here, so an abandoned
 * card payment never eats stock. COD orders already committed stock at checkout,
 * so they're skipped. Runs in a transaction with a row lock (`FOR UPDATE`) so
 * two concurrent calls (webhook + return-confirm) can't double-commit.
 */
export async function markOrderPaid(
  orderNumber: string,
  paymentRef?: string,
): Promise<MarkResult> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1)
      .for('update');
    if (!order) return { ok: false, reason: 'not_found' };
    if (order.paymentStatus === 'paid') return { ok: true, alreadyPaid: true };

    const history = [
      ...(order.statusHistory ?? []),
      {
        status: 'confirmed' as const,
        at: new Date().toISOString(),
        note: 'Payment received',
      },
    ];
    await tx
      .update(orders)
      .set({
        paymentStatus: 'paid',
        paymentRef: paymentRef ?? order.paymentRef,
        // Only advance a still-pending order; never rewind a fulfilled one.
        status: order.status === 'pending' ? 'confirmed' : order.status,
        statusHistory: history,
      })
      .where(eq(orders.orderNumber, orderNumber));

    // Commit inventory for online orders (COD committed it at checkout).
    if (order.paymentMethod !== 'cod') {
      for (const item of order.items) {
        if (!item.product) continue;
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            sold: sql`${products.sold} + ${item.quantity}`,
          })
          .where(eq(products.id, item.product));
      }
      if (order.couponCode) {
        await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.code, order.couponCode));
      }
    }
    return { ok: true };
  });
}

/** Record a failed payment attempt (order stays placed, payment = failed). */
export async function markOrderPaymentFailed(
  orderNumber: string,
): Promise<MarkResult> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) return { ok: false, reason: 'not_found' };
  // Don't clobber a payment that already succeeded.
  if (order.paymentStatus === 'paid') return { ok: true, alreadyPaid: true };
  await db
    .update(orders)
    .set({ paymentStatus: 'failed' as PaymentStatus })
    .where(eq(orders.orderNumber, orderNumber));
  return { ok: true };
}

export interface ConfirmResult {
  paid: boolean;
  status: string; // Stripe PaymentIntent status, or a sentinel
}

/**
 * Verify a Stripe PaymentIntent directly with Stripe and settle the matching
 * order. Used when the customer returns from Stripe (3DS/redirect) so we never
 * trust the browser's `redirect_status` — we re-check the real intent status,
 * and confirm the intent actually belongs to this order via its metadata.
 */
export async function confirmStripeOrder(
  orderNumber: string,
  paymentIntentId: string,
): Promise<ConfirmResult> {
  const stripe = await getStripe();
  if (!stripe) return { paid: false, status: 'unconfigured' };

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  // Anti-tamper: the intent must be the one we created for THIS order.
  if (pi.metadata?.orderNumber !== orderNumber) {
    return { paid: false, status: 'mismatch' };
  }
  if (pi.status === 'succeeded') {
    await markOrderPaid(orderNumber, pi.id);
    return { paid: true, status: pi.status };
  }
  if (pi.status === 'canceled') {
    await markOrderPaymentFailed(orderNumber);
  }
  return { paid: false, status: pi.status };
}
