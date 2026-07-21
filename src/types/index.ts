/** Shared domain types used across server, API and client. */

export type Role = 'super_admin' | 'admin' | 'customer';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// `stripe`/`paypal` are retained so historical orders keep rendering, but new
// orders can only be COD or one of the manual wallet methods (Easypaisa/JazzCash).
export type PaymentMethod = 'cod' | 'stripe' | 'paypal' | 'easypaisa' | 'jazzcash';

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface ProductVariant {
  name: string; // e.g. "Size"
  value: string; // e.g. "120ml"
  sku: string;
  priceDelta: number; // added to base price
  stock: number;
}

export interface SeoMeta {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string; // category slug
  categoryName: string;
  brand: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku: string;
  stock: number;
  images: ProductImage[];
  variants: ProductVariant[];
  features: string[];
  ingredients?: string;
  howToUse?: string;
  size?: string;
  tags: string[];
  rating: number;
  numReviews: number;
  sold: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  seo?: SeoMeta;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  order: number;
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: { name: string; value: string; sku: string };
  maxStock: number;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItem {
  product: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  variant?: { name: string; value: string; sku: string };
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: string;
  email: string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Customer-uploaded proof-of-payment screenshot (Easypaisa/JazzCash). */
  paymentProofUrl?: string | null;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  product: string;
  user: string;
  name: string;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface Testimonial {
  _id: string;
  name: string;
  role?: string;
  avatar?: string;
  rating: number;
  quote: string;
  isActive: boolean;
  order: number;
}

export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  ctaLabel?: string;
  ctaHref?: string;
  placement: 'hero' | 'promo' | 'strip';
  isActive: boolean;
  order: number;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}
