/**
 * Single source of truth for DailyWish business information.
 * Surfaced across the footer, contact page, store locator, SEO metadata
 * and structured data.
 */
export const siteConfig = {
  name: 'DailyWish',
  legalName: 'DailyWish by Majid Cosmetics',
  tagline: 'Glow Every Day',
  description:
    'DailyWish offers premium skincare & cosmetics - Vitamin C whitening face wash, serums, creams, anti-acne and skin polish - for fair, healthy, glowing skin.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  email: 'Kashifkhaan777@gmail.com',
  phone: '03135119536',
  phoneIntl: '+923135119536',
  whatsapp: '923135119536',
  currency: 'PKR',
  locale: 'en_PK',
  founded: 2021,
  social: {
    facebook: 'https://facebook.com/dailywish',
    instagram: 'https://instagram.com/majidcosmetics',
    tiktok: 'https://tiktok.com/@majidcosmetics10',
    youtube: 'https://youtube.com/@dailywish',
  },
  locations: [
    {
      id: 'swabi',
      name: 'DailyWish - Swabi',
      address: 'Majid Cosmetics, Nawaz Khan Plaza, Link Road, Swabi',
      city: 'Swabi',
      region: 'Khyber Pakhtunkhwa',
      country: 'Pakistan',
      mapsQuery: 'Majid+Cosmetics+Nawaz+Khan+Plaza+Link+Road+Swabi',
    },
    {
      id: 'mardan',
      name: 'DailyWish - Mardan',
      address:
        'Majid Cosmetics, Khan Cloth Tower, Moqam Chowk, District Mardan',
      city: 'Mardan',
      region: 'Khyber Pakhtunkhwa',
      country: 'Pakistan',
      mapsQuery: 'Majid+Cosmetics+Khan+Cloth+Tower+Moqam+Chowk+Mardan',
    },
  ],
  shipping: {
    freeThreshold: 2500,
    flatRate: 200,
    codFee: 0,
  },
} as const;

export type SiteLocation = (typeof siteConfig.locations)[number];

export const mainNav = [
  { title: 'Home', href: '/' },
  { title: 'Shop', href: '/shop' },
  { title: 'Categories', href: '/categories' },
  { title: 'About', href: '/about' },
  { title: 'Contact', href: '/contact' },
] as const;

export const footerNav = {
  shop: [
    { title: 'All Products', href: '/shop' },
    { title: 'Best Sellers', href: '/shop?sort=bestselling' },
    { title: 'New Arrivals', href: '/shop?sort=newest' },
    { title: 'Bundles & Deals', href: '/shop?category=bundles-deals' },
  ],
  account: [
    { title: 'My Account', href: '/account' },
    { title: 'Order History', href: '/account/orders' },
    { title: 'Wishlist', href: '/wishlist' },
    { title: 'Track Order', href: '/account/orders' },
  ],
  company: [
    { title: 'About Us', href: '/about' },
    { title: 'Contact', href: '/contact' },
    { title: 'Store Locations', href: '/contact#locations' },
  ],
  legal: [
    { title: 'Privacy Policy', href: '/privacy-policy' },
    { title: 'Terms & Conditions', href: '/terms' },
    { title: 'Return Policy', href: '/return-policy' },
  ],
} as const;
