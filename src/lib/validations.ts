import { z } from 'zod';

/** Reusable, strict input schemas. All API inputs pass through these. */

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).optional().or(z.literal('')),
  city: z.string().trim().min(2).max(60),
  region: z.string().trim().min(2).max(60),
  postalCode: z.string().trim().max(15).optional().or(z.literal('')),
  country: z.string().trim().min(2).max(60).default('Pakistan'),
  isDefault: z.boolean().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  source: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(2000),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal('')),
  comment: z.string().trim().min(5).max(2000),
  name: z.string().trim().min(2).max(80).optional(),
});

const cartItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  image: z.string().default(''),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(99),
  variant: z
    .object({ name: z.string(), value: z.string(), sku: z.string() })
    .optional(),
});

export const checkoutSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  items: z.array(cartItemSchema).min(1, 'Your cart is empty'),
  shippingAddress: addressSchema,
  // New orders can be Cash on Delivery or a manual mobile-wallet transfer
  // (Easypaisa / JazzCash). Stripe card + PayPal are intentionally omitted here
  // — `PaymentMethod` still includes them so historical orders keep rendering,
  // but the card UI is disabled (US/USD test-mode only). Re-add 'stripe' to this
  // enum and un-comment the card step in checkout/page.tsx to bring cards back.
  paymentMethod: z.enum(['cod', 'easypaisa', 'jazzcash']),
  couponCode: z.string().trim().toUpperCase().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const couponApplySchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(40),
  subtotal: z.coerce.number().nonnegative(),
});

// ── Admin schemas ──────────────────────────────────────────
export const productImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().default(''),
  isPrimary: z.boolean().optional(),
});

export const productVariantSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  sku: z.string().min(1),
  priceDelta: z.coerce.number().default(0),
  stock: z.coerce.number().int().min(0).default(0),
});

export const adminProductSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().optional(),
  shortDescription: z.string().trim().max(280).default(''),
  description: z.string().trim().default(''),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0),
  comparePrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  sku: z.string().trim().min(1),
  stock: z.coerce.number().int().min(0).default(0),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  features: z.array(z.string()).default([]),
  ingredients: z.string().optional(),
  howToUse: z.string().optional(),
  size: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const adminCategorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().optional(),
  description: z.string().trim().default(''),
  image: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

export const adminCouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(40),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().min(0),
  minSubtotal: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional(),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  paymentStatus: z
    .enum(['pending', 'paid', 'failed', 'refunded'])
    .optional(),
  note: z.string().max(300).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AdminProductInput = z.infer<typeof adminProductSchema>;
