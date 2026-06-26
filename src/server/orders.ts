import 'server-only';
import { and, eq, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { orders } from '@/db/schema';

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
