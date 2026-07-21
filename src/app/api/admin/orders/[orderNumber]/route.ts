import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, parseBody, ok, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { adminOrderStatusSchema } from '@/lib/validations';
import { orders, type OrderRow } from '@/db/schema';
import { logAdminAction } from '@/server/audit';
import { cancelOrder } from '@/server/orders';
import { markOrderPaid } from '@/server/payments';
import { sendEmail, orderStatusEmail } from '@/lib/email';

export const runtime = 'nodejs';

type Ctx = { params?: Promise<Record<string, string>> };

function serializeOrder(o: OrderRow) {
  return {
    _id: String(o.id),
    orderNumber: o.orderNumber,
    email: o.email,
    items: (o.items ?? []).map((i) => ({
      name: i.name,
      slug: i.slug,
      image: i.image ?? '',
      price: i.price,
      quantity: i.quantity,
      variant: i.variant ?? null,
    })),
    shippingAddress: o.shippingAddress,
    subtotal: o.subtotal,
    shipping: o.shipping ?? 0,
    discount: o.discount ?? 0,
    total: o.total,
    couponCode: o.couponCode ?? null,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    paymentProofUrl: o.paymentProofUrl ?? null,
    status: o.status,
    notes: o.notes ?? '',
    statusHistory: (o.statusHistory ?? []).map((h) => ({
      status: h.status,
      at: new Date(h.at ?? Date.now()).toISOString(),
      note: h.note ?? '',
    })),
    createdAt: new Date(o.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(o.updatedAt ?? Date.now()).toISOString(),
  };
}

export const GET = handler(async (_req: NextRequest, ctx: Ctx) => {
  await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const orderNumber = params.orderNumber;
  if (!orderNumber) return fail(400, 'Missing order number');

  const [doc] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!doc) return fail(404, 'Order not found');

  return ok(serializeOrder(doc));
});

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const orderNumber = params.orderNumber;
  if (!orderNumber) return fail(400, 'Missing order number');

  const parsed = await parseBody(req, adminOrderStatusSchema);
  if ('response' in parsed) return parsed.response;
  const { status, paymentStatus, note } = parsed.data;

  const [doc] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!doc) return fail(404, 'Order not found');

  // Cancelling is special: it must restore inventory + refund a paid card
  // order. Delegate to the shared, transactional cancelOrder helper, then
  // notify + audit-log like any other status change.
  if (status === 'cancelled' && doc.status !== 'cancelled') {
    await cancelOrder(orderNumber, { note });
    const [final] = await db.select().from(orders).where(eq(orders.id, doc.id)).limit(1);
    const order = final ?? doc;
    await logAdminAction(admin, 'order.cancel', 'Order', String(order.id), {
      orderNumber: order.orderNumber,
    });
    try {
      await sendEmail({ to: order.email, ...orderStatusEmail(order) });
    } catch {
      // email failures must not break the request
    }
    return ok(serializeOrder(order));
  }

  // Verifying a manual wallet payment (Easypaisa/JazzCash): flipping payment to
  // `paid` on a non-COD order must commit inventory + coupon usage, which only
  // `markOrderPaid` does (transactional, row-locked, idempotent). Setting the
  // column directly here would leave stock un-decremented. COD already committed
  // stock at checkout, so it just needs the column flip in the normal update.
  let base = doc;
  if (
    paymentStatus === 'paid' &&
    doc.paymentStatus !== 'paid' &&
    doc.paymentMethod !== 'cod'
  ) {
    await markOrderPaid(orderNumber, doc.paymentRef ?? undefined);
    const [fresh] = await db.select().from(orders).where(eq(orders.id, doc.id)).limit(1);
    if (fresh) base = fresh;
  }

  const statusChanged = base.status !== status;
  const statusHistory = [
    ...(base.statusHistory ?? []),
    { status, at: new Date().toISOString(), note },
  ];

  const updated = takeOne(
    await db
      .update(orders)
      .set({
        status,
        ...(paymentStatus ? { paymentStatus } : {}),
        statusHistory,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, base.id))
      .returning(),
  );

  await logAdminAction(admin, 'order.update', 'Order', String(updated.id), {
    orderNumber: updated.orderNumber,
    status,
    paymentStatus,
  });

  // Best-effort customer notification on status change.
  if (statusChanged) {
    try {
      const mail = orderStatusEmail(updated);
      await sendEmail({ to: updated.email, ...mail });
    } catch {
      // email failures must not break the request
    }
  }

  return ok(serializeOrder(updated));
});
