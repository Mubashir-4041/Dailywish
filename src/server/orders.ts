import 'server-only';
import { and, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { orders, products, coupons, users, type OrderRow } from '@/db/schema';
import { refundStripeOrder } from '@/server/payments';

/**
 * Which orders count as "real" / placed and should appear in customer + admin
 * order lists and stats. Cash-on-Delivery orders are always real (payment is
 * collected on delivery). Online-payment orders (stripe/paypal) only count once
 * they're actually paid (or refunded) — an unpaid/failed/abandoned card order is
 * provisional and must NOT pollute dashboards. Pair this with the deferred
 * stock commit in `markOrderPaid` so provisional orders also don't eat stock.
 */
export function placedOrderCondition(): SQL {
  return or(
    eq(orders.paymentMethod, 'cod'),
    inArray(orders.paymentStatus, ['paid', 'refunded']),
  )!;
}

export interface CancelResult {
  ok: boolean;
  alreadyCancelled?: boolean;
  reason?: 'not_found';
}

/**
 * Cancel an order: restore committed inventory (+ coupon usage), set status to
 * `cancelled`, and — for paid Stripe orders — issue a best-effort refund. Runs
 * the DB mutation in a `FOR UPDATE` transaction so it's safe against races and
 * idempotent (re-cancelling is a no-op). Inventory is only restored if it was
 * actually committed (COD orders commit at checkout; online orders commit on
 * payment), mirroring `markOrderPaid`.
 */
export async function cancelOrder(
  orderNumber: string,
  opts: { note?: string } = {},
): Promise<CancelResult> {
  const db = getDb();
  const outcome = await db.transaction(
    async (
      tx,
    ): Promise<{
      ok: boolean;
      alreadyCancelled?: boolean;
      reason?: 'not_found';
      order?: OrderRow;
    }> => {
      const [o] = await tx
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, orderNumber))
        .limit(1)
        .for('update');
      if (!o) return { ok: false, reason: 'not_found' };
      if (o.status === 'cancelled') return { ok: true, alreadyCancelled: true, order: o };

      const committed = o.paymentMethod === 'cod' || o.paymentStatus === 'paid';
      if (committed) {
        for (const item of o.items ?? []) {
          if (!item.product) continue;
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              sold: sql`greatest(0, ${products.sold} - ${item.quantity})`,
            })
            .where(eq(products.id, item.product));
        }
        if (o.couponCode) {
          await tx
            .update(coupons)
            .set({ usedCount: sql`greatest(0, ${coupons.usedCount} - 1)` })
            .where(eq(coupons.code, o.couponCode));
        }
      }

      const statusHistory = [
        ...(o.statusHistory ?? []),
        { status: 'cancelled' as const, at: new Date().toISOString(), note: opts.note },
      ];
      const [updated] = await tx
        .update(orders)
        .set({ status: 'cancelled', statusHistory, updatedAt: new Date() })
        .where(eq(orders.id, o.id))
        .returning();
      return { ok: true, order: updated };
    },
  );

  // Best-effort refund OUTSIDE the txn (network call). Only for a freshly
  // cancelled, paid Stripe order.
  if (outcome.ok && !outcome.alreadyCancelled && outcome.order) {
    const o = outcome.order;
    if (o.paymentStatus === 'paid' && o.paymentMethod === 'stripe' && o.paymentRef) {
      await refundStripeOrder(orderNumber, o.paymentRef).catch(() => undefined);
    }
  }

  return { ok: outcome.ok, alreadyCancelled: outcome.alreadyCancelled, reason: outcome.reason };
}

/**
 * A passwordless "shadow" account is created for guests at checkout so their
 * order attaches to a real customer profile (visible in admin) and can be
 * claimed later. It is marked by an EMPTY password hash — bcrypt.compare never
 * matches an empty hash, so a shadow account can't be logged into until the
 * person registers with the same email and sets a password (see register).
 */
export const SHADOW_PASSWORD_HASH = '';

/**
 * Find-or-create a customer profile for a guest checkout, keyed by email.
 * Returns the user id to attach the order to, or `null` if it couldn't be
 * created (the order is still placed as a guest order and stays claimable).
 *
 * Race-safe: a concurrent checkout with the same new email can't cause a
 * unique-violation crash — `onConflictDoNothing` + a follow-up read resolves it.
 * If the email already belongs to a real account, that account is reused so the
 * order shows up in their dashboard.
 */
export async function ensureGuestProfile(
  email: string,
  name?: string,
  phone?: string,
): Promise<string | null> {
  try {
    const db = getDb();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) return String(existing.id);

    const [created] = await db
      .insert(users)
      .values({
        name: name?.trim() || email.split('@')[0] || 'Guest',
        email,
        passwordHash: SHADOW_PASSWORD_HASH,
        role: 'customer',
        phone: phone?.trim() || null,
      })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });
    if (created) return String(created.id);

    // Lost the insert race — the row now exists, fetch it.
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row ? String(row.id) : null;
  } catch {
    // Never block an order on profile creation.
    return null;
  }
}

/**
 * Link any guest orders (placed with no account) to a user the moment they
 * register or log in, matched on the order email. This is what makes an order
 * placed as a guest show up under "My Orders" after the customer creates an
 * account with the same email. Best-effort — never block auth on it.
 *
 * Returns the number of orders claimed. Safe to call repeatedly (already-owned
 * orders are excluded by the `userId IS NULL` guard).
 */
export async function claimGuestOrders(
  userId: string,
  email: string,
): Promise<number> {
  try {
    const db = getDb();
    const rows = await db
      .update(orders)
      .set({ userId })
      .where(and(eq(orders.email, email), isNull(orders.userId)))
      .returning({ id: orders.id });
    return rows.length;
  } catch {
    // best-effort: a failure here must not break login/registration
    return 0;
  }
}
