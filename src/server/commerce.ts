import 'server-only';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { coupons, products as productsTable } from '@/db/schema';
import { products as staticProducts } from '@/data/catalog';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CouponResult {
  ok: boolean;
  discount: number;
  message: string;
  code?: string;
}

/** Validate a coupon against a subtotal and compute the discount. */
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponResult> {
  if (!process.env.DATABASE_URL) {
    // Built-in demo coupons for offline mode.
    if (code === 'WELCOME10' && subtotal >= 1000) {
      return { ok: true, discount: Math.min(subtotal * 0.1, 500), message: '10% off applied', code };
    }
    if (code === 'GLOW250' && subtotal >= 2500) {
      return { ok: true, discount: 250, message: 'Rs. 250 off applied', code };
    }
    return { ok: false, discount: 0, message: 'Invalid or inapplicable coupon' };
  }

  const db = getDb();
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true)))
    .limit(1);
  if (!coupon) return { ok: false, discount: 0, message: 'Coupon not found' };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now)
    return { ok: false, discount: 0, message: 'Coupon is not active yet' };
  if (coupon.expiresAt && coupon.expiresAt < now)
    return { ok: false, discount: 0, message: 'Coupon has expired' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, discount: 0, message: 'Coupon usage limit reached' };
  if (subtotal < coupon.minSubtotal)
    return {
      ok: false,
      discount: 0,
      message: `Minimum order of ${coupon.minSubtotal} PKR required`,
    };

  let discount =
    coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);

  return {
    ok: true,
    discount: Math.round(discount),
    message: 'Coupon applied',
    code: coupon.code,
  };
}

/** Re-price cart items server-side against the source of truth (anti-tampering). */
export async function priceCartItems(
  items: { productId: string; quantity: number; variant?: { sku: string } }[],
): Promise<
  | {
      ok: true;
      lines: {
        productId: string;
        name: string;
        slug: string;
        image: string;
        price: number;
        quantity: number;
        variant?: { name: string; value: string; sku: string };
      }[];
      subtotal: number;
    }
  | { ok: false; message: string }
> {
  const useDb = !!process.env.DATABASE_URL;
  const db = useDb ? getDb() : null;

  const lines = [];
  let subtotal = 0;

  for (const item of items) {
    let product:
      | {
          id: string;
          name: string;
          slug: string;
          price: number;
          isActive: boolean;
          images: { url: string; alt: string; isPrimary: boolean }[];
          variants: { name: string; value: string; sku: string; priceDelta: number }[];
        }
      | undefined;

    if (db) {
      // Guard against malformed ids - a non-uuid would otherwise throw at the DB.
      if (!UUID_RE.test(item.productId)) {
        return { ok: false, message: 'A product in your cart is no longer available' };
      }
      const [row] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, item.productId))
        .limit(1);
      product = row as typeof product;
    } else {
      const s = staticProducts.find((p) => p._id === item.productId);
      product = s
        ? {
            id: s._id,
            name: s.name,
            slug: s.slug,
            price: s.price,
            isActive: s.isActive,
            images: s.images.map((i) => ({ url: i.url, alt: i.alt, isPrimary: !!i.isPrimary })),
            variants: s.variants,
          }
        : undefined;
    }

    if (!product || product.isActive === false) {
      return { ok: false, message: 'A product in your cart is no longer available' };
    }

    let price = product.price;
    let variant: { name: string; value: string; sku: string } | undefined;
    if (item.variant?.sku) {
      const v = (product.variants ?? []).find((x) => x.sku === item.variant!.sku);
      if (v) {
        price += v.priceDelta;
        variant = { name: v.name, value: v.value, sku: v.sku };
      }
    }

    const qty = Math.max(1, Math.min(99, item.quantity));
    subtotal += price * qty;
    const primary =
      (product.images ?? []).find((i) => i.isPrimary) ?? product.images?.[0];
    lines.push({
      productId: String(product.id),
      name: product.name,
      slug: product.slug,
      image: primary?.url ?? '',
      price,
      quantity: qty,
      variant,
    });
  }

  return { ok: true, lines, subtotal };
}
