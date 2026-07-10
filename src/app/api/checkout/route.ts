import type { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { handler, parseBody, enforceRateLimit, created, fail, takeOne } from '@/lib/api';
import { checkoutSchema } from '@/lib/validations';
import { priceCartItems, validateCoupon } from '@/server/commerce';
import { getPaymentProvider } from '@/lib/payments';
import { getDb } from '@/lib/db';
import { orders, products, coupons } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { ensureGuestProfile } from '@/server/orders';
import { signOrderToken } from '@/lib/jwt';
import { sendEmail, orderConfirmationEmail } from '@/lib/email';
import { generateOrderNumber } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const limited = enforceRateLimit(req, 'checkout', { limit: 12, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseBody(req, checkoutSchema);
  if ('response' in parsed) return parsed.response;
  const input = parsed.data;

  // Re-price server-side to prevent tampering.
  const priced = await priceCartItems(input.items);
  if (!priced.ok) return fail(400, priced.message);

  const { lines, subtotal } = priced;
  const shipping =
    subtotal >= siteConfig.shipping.freeThreshold ? 0 : siteConfig.shipping.flatRate;

  let discount = 0;
  let couponCode: string | undefined;
  if (input.couponCode) {
    const coupon = await validateCoupon(input.couponCode, subtotal);
    if (coupon.ok) {
      discount = coupon.discount;
      couponCode = coupon.code;
    }
  }

  const total = Math.max(0, subtotal + shipping - discount);
  const orderNumber = generateOrderNumber();

  // Attach the order to a customer profile. Logged-in users use their account;
  // guests get a passwordless profile auto-created from their checkout details
  // (find-or-create by email) so every order ties to a real customer record and
  // is claimable later. Falls back to a guest order (userId null) if it can't.
  const user = await getCurrentUser();
  let customerId: string | null = user?.id ?? null;
  if (!customerId && process.env.DATABASE_URL) {
    customerId = await ensureGuestProfile(
      input.email,
      input.shippingAddress.fullName,
      input.shippingAddress.phone,
    );
  }

  // Initiate payment.
  const payment = getPaymentProvider(input.paymentMethod);
  const paymentResult = await payment.createPayment({
    orderNumber,
    amount: total,
    currency: siteConfig.currency,
    email: input.email,
    description: `DailyWish order ${orderNumber}`,
  });

  const orderValues = {
    orderNumber,
    userId: customerId,
    email: input.email,
    // Map priced cart lines (`productId`) onto the Order item shape (`product`).
    items: lines.map((l) => ({
      product: l.productId,
      name: l.name,
      slug: l.slug,
      image: l.image,
      price: l.price,
      quantity: l.quantity,
      variant: l.variant,
    })),
    shippingAddress: input.shippingAddress,
    subtotal,
    shipping,
    discount,
    total,
    couponCode: couponCode ?? null,
    paymentMethod: input.paymentMethod,
    paymentStatus: (paymentResult.status === 'paid' ? 'paid' : 'pending') as
      | 'paid'
      | 'pending',
    paymentRef: paymentResult.reference ?? null,
    status: 'pending' as const,
    notes: input.notes || null,
    statusHistory: [{ status: 'pending' as const, at: new Date().toISOString() }],
  };

  if (process.env.DATABASE_URL) {
    const db = getDb();
    // Persist order, decrement stock & bump coupon usage atomically.
    const order = await db.transaction(async (tx) => {
      const row = takeOne(await tx.insert(orders).values(orderValues).returning());
      // Commit inventory immediately ONLY for Cash on Delivery. For online
      // payments the order is provisional until paid — stock/sold + coupon usage
      // are committed in `markOrderPaid` once Stripe confirms, so an abandoned
      // card payment never decrements stock or burns a coupon.
      if (input.paymentMethod === 'cod') {
        for (const l of lines) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${l.quantity}`,
              sold: sql`${products.sold} + ${l.quantity}`,
            })
            .where(eq(products.id, l.productId));
        }
        if (couponCode) {
          await tx
            .update(coupons)
            .set({ usedCount: sql`${coupons.usedCount} + 1` })
            .where(eq(coupons.code, couponCode));
        }
      }
      return row;
    });

    // Magic tracking link — lets a guest view this order without an account.
    const trackToken = await signOrderToken({ orderNumber, email: input.email });
    const trackingUrl = `${siteConfig.url}/track/${orderNumber}?token=${trackToken}`;

    void sendEmail({ to: input.email, ...orderConfirmationEmail(order, { trackingUrl }) });

    return created({
      orderNumber,
      total,
      payment: paymentResult,
      track: trackToken,
    });
  }

  // Offline/demo mode - order is computed but not persisted.
  return created({
    orderNumber,
    total,
    payment: paymentResult,
    note: 'Demo mode: configure DATABASE_URL to persist orders.',
  });
});
