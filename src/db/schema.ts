import {
  pgTable,
  uuid,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type {
  Role,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ProductImage,
  ProductVariant,
  SeoMeta,
  Address,
  OrderItem,
} from '@/types';

/**
 * Drizzle schema for Supabase Postgres. Replaces the previous Mongoose models.
 *
 * Conventions:
 * - Primary keys are uuid `id` columns (exposed to the API as `_id` strings by
 *   the serializers, so the external contract is unchanged from the Mongo era).
 * - Embedded value-objects (images, variants, addresses, order items, SEO,
 *   status history, settings values, audit metadata) are stored as `jsonb`.
 * - Timestamps are timestamptz with DB-side defaults.
 */

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<Role>().notNull().default('customer'),
    phone: text('phone'),
    avatar: text('avatar'),
    addresses: jsonb('addresses').$type<(Address & { _id: string })[]>().notNull().default([]),
    isEmailVerified: boolean('is_email_verified').notNull().default(false),
    emailVerificationToken: text('email_verification_token'),
    emailVerificationExpiry: timestamp('email_verification_expiry', { withTimezone: true }),
    passwordResetToken: text('password_reset_token'),
    passwordResetExpiry: timestamp('password_reset_expiry', { withTimezone: true }),
    tokenVersion: integer('token_version').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_unique').on(t.email),
    index('users_role_idx').on(t.role),
  ],
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description').notNull().default(''),
    image: text('image'),
    icon: text('icon'),
    parentId: uuid('parent_id'),
    isActive: boolean('is_active').notNull().default(true),
    order: integer('order').notNull().default(0),
    seo: jsonb('seo').$type<SeoMeta>(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('categories_slug_unique').on(t.slug),
    index('categories_active_order_idx').on(t.isActive, t.order),
  ],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    shortDescription: text('short_description').notNull().default(''),
    description: text('description').notNull().default(''),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    categorySlug: text('category_slug').notNull(),
    categoryName: text('category_name').notNull(),
    brand: text('brand').notNull().default('DailyWish'),
    price: doublePrecision('price').notNull(),
    comparePrice: doublePrecision('compare_price'),
    costPrice: doublePrecision('cost_price'),
    sku: text('sku').notNull(),
    stock: integer('stock').notNull().default(0),
    images: jsonb('images').$type<ProductImage[]>().notNull().default([]),
    variants: jsonb('variants').$type<ProductVariant[]>().notNull().default([]),
    features: text('features').array().notNull().default([]),
    ingredients: text('ingredients'),
    howToUse: text('how_to_use'),
    size: text('size'),
    tags: text('tags').array().notNull().default([]),
    rating: doublePrecision('rating').notNull().default(0),
    numReviews: integer('num_reviews').notNull().default(0),
    sold: integer('sold').notNull().default(0),
    isFeatured: boolean('is_featured').notNull().default(false),
    isBestSeller: boolean('is_best_seller').notNull().default(false),
    isNewArrival: boolean('is_new_arrival').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    seo: jsonb('seo').$type<SeoMeta>(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('products_slug_unique').on(t.slug),
    uniqueIndex('products_sku_unique').on(t.sku),
    index('products_active_category_price_idx').on(t.isActive, t.categorySlug, t.price),
    index('products_active_created_idx').on(t.isActive, t.createdAt),
    index('products_sold_idx').on(t.sold),
  ],
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    userId: uuid('user_id').references(() => users.id),
    name: text('name').notNull(),
    rating: integer('rating').notNull(),
    title: text('title'),
    comment: text('comment').notNull(),
    isApproved: boolean('is_approved').notNull().default(false),
    isVerifiedPurchase: boolean('is_verified_purchase').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('reviews_product_approved_created_idx').on(t.productId, t.isApproved, t.createdAt),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').notNull(),
    userId: uuid('user_id').references(() => users.id),
    email: text('email').notNull(),
    items: jsonb('items').$type<OrderItem[]>().notNull(),
    shippingAddress: jsonb('shipping_address')
      .$type<Omit<Address, 'isDefault' | 'country'> & { country?: string }>()
      .notNull(),
    subtotal: doublePrecision('subtotal').notNull(),
    shipping: doublePrecision('shipping').notNull().default(0),
    discount: doublePrecision('discount').notNull().default(0),
    total: doublePrecision('total').notNull(),
    couponCode: text('coupon_code'),
    paymentMethod: text('payment_method').$type<PaymentMethod>().notNull().default('cod'),
    paymentStatus: text('payment_status').$type<PaymentStatus>().notNull().default('pending'),
    paymentRef: text('payment_ref'),
    // Customer-uploaded proof-of-payment screenshot (Cloudinary URL) for the
    // manual wallet methods (Easypaisa/JazzCash). Null for COD/card orders.
    paymentProofUrl: text('payment_proof_url'),
    status: text('status').$type<OrderStatus>().notNull().default('pending'),
    notes: text('notes'),
    statusHistory: jsonb('status_history')
      .$type<{ status: OrderStatus; at: string; note?: string }[]>()
      .notNull()
      .default([]),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('orders_order_number_unique').on(t.orderNumber),
    index('orders_email_idx').on(t.email),
    index('orders_status_idx').on(t.status),
    index('orders_payment_status_idx').on(t.paymentStatus),
    index('orders_created_idx').on(t.createdAt),
    index('orders_user_created_idx').on(t.userId, t.createdAt),
  ],
);

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    description: text('description'),
    type: text('type').$type<'percentage' | 'fixed'>().notNull(),
    value: doublePrecision('value').notNull(),
    minSubtotal: doublePrecision('min_subtotal').notNull().default(0),
    maxDiscount: doublePrecision('max_discount'),
    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').notNull().default(0),
    perUserLimit: integer('per_user_limit'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex('coupons_code_unique').on(t.code)],
);

export const banners = pgTable(
  'banners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    image: text('image').notNull(),
    ctaLabel: text('cta_label'),
    ctaHref: text('cta_href'),
    placement: text('placement').$type<'hero' | 'promo' | 'strip'>().notNull().default('hero'),
    isActive: boolean('is_active').notNull().default(true),
    order: integer('order').notNull().default(0),
    ...timestamps,
  },
  (t) => [index('banners_placement_idx').on(t.placement)],
);

export const testimonials = pgTable('testimonials', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: text('role'),
  avatar: text('avatar'),
  rating: integer('rating').notNull().default(5),
  quote: text('quote').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  order: integer('order').notNull().default(0),
  ...timestamps,
});

export const settings = pgTable(
  'settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    value: jsonb('value'),
    group: text('group').notNull().default('general'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('settings_key_unique').on(t.key),
    index('settings_group_idx').on(t.group),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id),
    actorEmail: text('actor_email').notNull(),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('audit_logs_actor_idx').on(t.actorId),
    index('audit_logs_action_idx').on(t.action),
    index('audit_logs_created_idx').on(t.createdAt),
  ],
);

export const newsletters = pgTable(
  'newsletters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    source: text('source').default('footer'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('newsletters_email_unique').on(t.email)],
);

export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    products: uuid('products').array().notNull().default([]),
    ...timestamps,
  },
  (t) => [uniqueIndex('wishlists_user_unique').on(t.userId)],
);

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('contact_messages_created_idx').on(t.createdAt),
    index('contact_messages_read_idx').on(t.isRead),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
export type CouponRow = typeof coupons.$inferSelect;
export type BannerRow = typeof banners.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type SettingRow = typeof settings.$inferSelect;
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type NewsletterRow = typeof newsletters.$inferSelect;
export type WishlistRow = typeof wishlists.$inferSelect;
export type ContactMessageRow = typeof contactMessages.$inferSelect;
