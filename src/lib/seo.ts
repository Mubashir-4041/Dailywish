import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

const BASE = siteConfig.url;

export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: `${siteConfig.name} - Premium Skincare & Cosmetics in Pakistan`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    'DailyWish',
    'Majid Cosmetics',
    'Vitamin C face wash',
    'whitening cream',
    'skincare Pakistan',
    'anti-acne cream',
    'skin polish',
    'beauty products',
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.legalName,
  formatDetection: { telephone: true, address: true, email: true },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: BASE,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - Glow Every Day`,
    description: siteConfig.description,
    images: [
      {
        url: '/banners/hero-1.jpeg',
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} skincare`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Glow Every Day`,
    description: siteConfig.description,
    images: ['/banners/hero-1.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  verification: {
    google: '2BJCQyP6WQAcAHsHVlosff_xDz1aItKCFrrWS4yLYzs',
  },
  alternates: { canonical: '/' },
};

/**
 * Per-page metadata with a SELF-REFERENCING canonical.
 *
 * The root `defaultMetadata` sets `alternates.canonical: '/'`, which Next.js
 * merges into every page that doesn't override it — so any page lacking its own
 * canonical would wrongly canonicalise to the homepage. Client-component pages
 * (`'use client'`) can't `export const metadata`, so their route folder gets a
 * tiny server `layout.tsx` that calls this to restore a self-referencing
 * canonical (and opt out of indexing for private/utility routes).
 *
 * `path` must be the page's own path (e.g. '/login'); it's resolved against
 * `metadataBase` (the production domain) by Next.
 */
export function pageMeta(opts: {
  title?: string;
  description?: string;
  path: string;
  index?: boolean;
}): Metadata {
  const meta: Metadata = {
    alternates: { canonical: opts.path },
  };
  if (opts.title) meta.title = opts.title;
  if (opts.description) meta.description = opts.description;
  if (opts.index === false) {
    meta.robots = { index: false, follow: false, googleBot: { index: false, follow: false } };
  }
  return meta;
}

export function buildProductMetadata(product: Product): Metadata {
  const title = product.seo?.title ?? product.name;
  const description =
    product.seo?.description ?? product.shortDescription ?? siteConfig.description;
  const image = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;
  const url = `${BASE}/product/${product.slug}`;
  return {
    title,
    description,
    keywords: product.seo?.keywords ?? product.tags,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: image ? [{ url: image, width: 1000, height: 1000, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

/** JSON-LD: Organization + LocalBusiness with both store locations. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: BASE,
    email: siteConfig.email,
    telephone: siteConfig.phoneIntl,
    image: `${BASE}/banners/hero-1.jpeg`,
    sameAs: Object.values(siteConfig.social),
    location: siteConfig.locations.map((loc) => ({
      '@type': 'LocalBusiness',
      name: loc.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: loc.address,
        addressLocality: loc.city,
        addressRegion: loc.region,
        addressCountry: 'PK',
      },
    })),
  };
}

export interface ProductReviewLd {
  name: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export function productJsonLd(product: Product, reviews: ProductReviewLd[] = []) {
  // Image URLs may be absolute (Cloudinary) or root-relative (local /public
  // assets). Only prefix the origin onto relative paths — prefixing an already
  // absolute URL produced malformed `https://host/https://res.cloudinary…`
  // links that Google couldn't fetch.
  const image = product.images.map((i) =>
    i.url.startsWith('http') ? i.url : `${BASE}${i.url}`,
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image,
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand },
    // Only emitted when real, approved reviews exist — never fabricate ratings
    // (Google structured-data policy). Products with 0 reviews simply omit
    // these fields; the resulting Search Console warning is non-critical.
    aggregateRating:
      product.numReviews > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.numReviews,
          }
        : undefined,
    review: reviews.length
      ? reviews.map((r) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.name },
          datePublished: r.createdAt.slice(0, 10),
          name: r.title || undefined,
          reviewBody: r.comment,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: r.rating,
            bestRating: 5,
            worstRating: 1,
          },
        }))
      : undefined,
    offers: {
      '@type': 'Offer',
      url: `${BASE}/product/${product.slug}`,
      priceCurrency: siteConfig.currency,
      price: product.price,
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: siteConfig.name },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${BASE}${item.url}`,
    })),
  };
}

export { formatPrice };
