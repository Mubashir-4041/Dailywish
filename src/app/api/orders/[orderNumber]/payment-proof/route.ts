import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, ok, fail, enforceRateLimit } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { orders } from '@/db/schema';
import { isCloudinaryConfigured, uploadImageBuffer } from '@/lib/cloudinary';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MANUAL_METHODS = ['easypaisa', 'jazzcash'];

/**
 * Customer uploads a proof-of-payment screenshot for a manual wallet order
 * (Easypaisa / JazzCash). Owner-scoped: the caller must own the order. The
 * screenshot goes to Cloudinary and its URL is stored on the order; an admin
 * later reviews it and verifies the payment. The order is NOT marked paid here
 * — only an admin can do that (see the admin order route).
 */
export const POST = handler(
  async (req: NextRequest, ctx: { params?: Promise<Record<string, string>> }) => {
    const limited = enforceRateLimit(req, 'payment-proof', { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const session = await requireUser();
    const params = ctx.params ? await ctx.params : {};
    const orderNumber = params.orderNumber;
    if (!orderNumber) return fail(400, 'Missing order number');

    if (!isCloudinaryConfigured) {
      return fail(503, 'Image uploads are not configured on the server. Ask the store admin to set the CLOUDINARY_* keys.');
    }

    const db = getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);
    if (!order) return fail(404, 'Order not found');

    // Only the account that owns this order may attach a payment screenshot.
    if (!order.userId || String(order.userId) !== session.id) {
      return fail(403, 'You are not authorized to update this order');
    }
    if (!MANUAL_METHODS.includes(order.paymentMethod)) {
      return fail(400, 'This order is not paid via Easypaisa or JazzCash.');
    }
    if (order.paymentStatus === 'paid') {
      return fail(400, 'This order is already marked as paid.');
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return fail(400, 'No screenshot attached. Please select your payment screenshot image.');
    }
    if (!ALLOWED.includes(file.type)) {
      return fail(415, 'Please upload an image (JPEG, PNG, WebP, AVIF or GIF).');
    }
    if (file.size > MAX_BYTES) {
      return fail(413, 'That image is too large. Please upload one under 8 MB.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImageBuffer(buffer, {
      folder: 'dailywish/payment-proofs',
      mimetype: file.type,
    });

    const history = [
      ...(order.statusHistory ?? []),
      {
        status: order.status,
        at: new Date().toISOString(),
        note: 'Customer uploaded a payment screenshot — awaiting verification.',
      },
    ];
    await db
      .update(orders)
      .set({ paymentProofUrl: result.url, statusHistory: history, updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    return ok({ paymentProofUrl: result.url });
  },
);
