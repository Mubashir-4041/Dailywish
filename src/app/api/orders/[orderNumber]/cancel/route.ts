import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, ok, fail } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { orders } from '@/db/schema';
import { cancelOrder } from '@/server/orders';
import type { OrderStatus } from '@/types';

export const runtime = 'nodejs';

// A customer may cancel only before the order is being fulfilled.
const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed'];

export const POST = handler(
  async (_req: NextRequest, ctx: { params?: Promise<Record<string, string>> }) => {
    const user = await requireUser();
    const params = ctx.params ? await ctx.params : {};
    const orderNumber = params.orderNumber;
    if (!orderNumber) return fail(400, 'Missing order number');
    if (!process.env.DATABASE_URL) return fail(503, 'Order management requires a database connection.');

    const db = getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);
    if (!order) return fail(404, 'Order not found');

    // Only the owner can cancel their own order (no IDOR).
    if (!order.userId || String(order.userId) !== user.id) {
      return fail(403, 'You are not authorized to cancel this order');
    }
    if (!CANCELLABLE.includes(order.status)) {
      return fail(400, `This order can no longer be cancelled (it is ${order.status}).`);
    }

    const result = await cancelOrder(orderNumber, { note: 'Cancelled by customer' });
    if (!result.ok) return fail(404, 'Order not found');
    return ok({ success: true });
  },
);
