import type { Category, Product, Testimonial, Banner } from '@/types';

/**
 * Canonical DailyWish catalog.
 *
 * This is the single source of truth used by:
 *   • `scripts/seed.ts` to populate MongoDB Atlas, and
 *   • the data-access layer as an offline fallback when no DB is configured.
 *
 * Products & imagery are derived from the real DailyWish (Majid Cosmetics)
 * product range. Prices are in PKR.
 */

const NOW = '2026-01-01T00:00:00.000Z';

export const categories: Category[] = [
  {
    _id: 'cat_facewash',
    name: 'Face Wash & Cleansers',
    slug: 'face-wash',
    description:
      'Gentle, effective daily cleansers that purify, brighten and refresh your skin.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068698/dailywish/products/facewash-1.jpg',
    icon: 'droplets',
    isActive: true,
    order: 1,
  },
  {
    _id: 'cat_serums',
    name: 'Serums',
    slug: 'serums',
    description:
      'Concentrated active serums that target dullness, dark spots and fine lines.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068704/dailywish/products/serum-1.jpg',
    icon: 'flask-conical',
    isActive: true,
    order: 2,
  },
  {
    _id: 'cat_creams',
    name: 'Creams & Moisturizers',
    slug: 'creams',
    description:
      'Nourishing day & night creams for soft, hydrated and radiant skin.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068703/dailywish/products/nightcream-1.jpg',
    icon: 'sparkles',
    isActive: true,
    order: 3,
  },
  {
    _id: 'cat_whitening',
    name: 'Whitening & Brightening',
    slug: 'whitening',
    description:
      'Advanced whitening formulas for a fairer, even-toned, glowing complexion.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068702/dailywish/products/goldcream-1.jpg',
    icon: 'sun',
    isActive: true,
    order: 4,
  },
  {
    _id: 'cat_antiacne',
    name: 'Acne Care',
    slug: 'anti-acne',
    description:
      'Dermatologist-inspired acne care that clears breakouts and prevents future pimples.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068693/dailywish/products/antiacne-1.jpg',
    icon: 'shield-check',
    isActive: true,
    order: 5,
  },
  {
    _id: 'cat_skinpolish',
    name: 'Skin Polish & Scrubs',
    slug: 'skin-polish',
    description:
      'Ultra-glowing skin polish kits that exfoliate dead cells and reveal flawless skin.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068705/dailywish/products/skinpolish-1.jpg',
    icon: 'gem',
    isActive: true,
    order: 6,
  },
  {
    _id: 'cat_bundles',
    name: 'Bundles & Deals',
    slug: 'bundles-deals',
    description:
      'Curated value sets - get your complete DailyWish glow routine and save more.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068697/dailywish/products/bundle-1.jpg',
    icon: 'gift',
    isActive: true,
    order: 7,
  },
];

type SeedProduct = Omit<Product, 'createdAt' | 'updatedAt'>;

const p = (data: SeedProduct): Product => ({
  ...data,
  createdAt: NOW,
  updatedAt: NOW,
});

export const products: Product[] = [
  p({
    _id: 'prod_facewash',
    name: 'Vitamin C Whitening Face Wash',
    slug: 'vitamin-c-whitening-face-wash',
    shortDescription:
      'A soft, soothing face wash that cleanses without stripping - for fair & glowing skin.',
    description:
      'DailyWish Vitamin C Whitening Face Wash (Advanced Formula) gently cleanses your skin while the power of Vitamin C brightens your complexion and fights dullness. Enriched with refreshing micro-beads, it removes dirt, oil and impurities to reveal soft, clear and glowing skin. Targets whitening, freckles, anti-aging, dark circles and blackheads. Suitable for all skin types - perfect for daily care, even on sensitive skin.',
    category: 'face-wash',
    categoryName: 'Face Wash & Cleansers',
    brand: 'DailyWish',
    price: 650,
    comparePrice: 850,
    costPrice: 300,
    sku: 'DW-FW-VITC-120',
    stock: 240,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068698/dailywish/products/facewash-1.jpg', alt: 'DailyWish Vitamin C Whitening Face Wash 120ml', isPrimary: true },
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068699/dailywish/products/facewash-2.jpg', alt: 'Vitamin C Face Wash with fresh oranges' },
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068700/dailywish/products/facewash-3.jpg', alt: 'Vitamin C Face Wash held in hand' },
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068701/dailywish/products/facewash-4.jpg', alt: 'Vitamin C Face Wash lifestyle shot' },
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068702/dailywish/products/facewash-5.jpg', alt: 'Vitamin C Face Wash bead-rich texture' },
    ],
    variants: [],
    features: [
      'Brightens with Vitamin C',
      'Removes freckles & dark spots',
      'Anti-aging formula',
      'Targets blackheads',
      'Suitable for all skin types',
    ],
    ingredients:
      'Aqua, Sodium Laureth Sulfate, Ascorbic Acid (Vitamin C), Glycerin, Citrus Extract, Exfoliating Beads, Fragrance.',
    howToUse:
      'Apply a small amount to wet face, massage gently in circular motions for 30 seconds, then rinse with water. Use twice daily, morning and night.',
    size: '120ml',
    tags: ['vitamin c', 'whitening', 'face wash', 'best seller', 'glow'],
    rating: 4.8,
    numReviews: 213,
    sold: 1890,
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    seo: {
      title: 'Vitamin C Whitening Face Wash 120ml | DailyWish',
      description:
        'Brighten & glow with DailyWish Vitamin C Whitening Face Wash. Removes freckles, dark circles & blackheads. For all skin types. Order online in Pakistan.',
      keywords: ['vitamin c face wash', 'whitening face wash', 'dailywish', 'glowing skin'],
    },
  }),
  p({
    _id: 'prod_serum',
    name: 'Vitamin C Whitening Serum',
    slug: 'vitamin-c-whitening-serum',
    shortDescription:
      'Lightweight brightening serum that fades dark spots and boosts radiance.',
    description:
      'A potent DailyWish Vitamin C Whitening Serum that absorbs quickly to deliver a concentrated dose of brightening actives deep into the skin. Helps fade dark spots, even out skin tone, hydrate and reveal a luminous, youthful glow. Part of the Vitamin C Complete Skincare Collection.',
    category: 'serums',
    categoryName: 'Serums',
    brand: 'DailyWish',
    price: 1200,
    comparePrice: 1500,
    costPrice: 520,
    sku: 'DW-SR-VITC-30',
    stock: 160,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068704/dailywish/products/serum-1.jpg', alt: 'DailyWish Vitamin C Whitening Serum 30ml', isPrimary: true },
    ],
    variants: [],
    features: [
      'Concentrated Vitamin C',
      'Fades dark spots',
      'Boosts radiance & clarity',
      'Fast-absorbing & non-greasy',
    ],
    ingredients:
      'Aqua, Ascorbic Acid (Vitamin C), Hyaluronic Acid, Niacinamide, Glycerin, Vitamin E, Citrus Extract.',
    howToUse:
      'After cleansing, apply 3–4 drops to face and neck. Pat gently until absorbed. Follow with moisturizer. Use morning and night.',
    size: '30ml',
    tags: ['vitamin c', 'serum', 'whitening', 'new', 'glow'],
    rating: 4.7,
    numReviews: 86,
    sold: 540,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
  }),
  p({
    _id: 'prod_nightcream',
    name: 'Vitamin C Night Cream',
    slug: 'vitamin-c-night-cream',
    shortDescription:
      'Overnight repair cream for hydration, clarity and a morning glow.',
    description:
      'DailyWish Vitamin C Night Cream works while you sleep to repair, hydrate and brighten. Its rich yet breathable formula restores moisture, smooths texture and helps you wake up to clearer, glowing skin. The perfect final step of your Vitamin C journey.',
    category: 'creams',
    categoryName: 'Creams & Moisturizers',
    brand: 'DailyWish',
    price: 950,
    comparePrice: 1200,
    costPrice: 410,
    sku: 'DW-NC-VITC-50',
    stock: 130,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068703/dailywish/products/nightcream-1.jpg', alt: 'DailyWish Vitamin C Night Cream 50g', isPrimary: true },
    ],
    variants: [],
    features: [
      'Overnight repair & hydration',
      'Brightens with Vitamin C',
      'Smooths skin texture',
      'For all skin types',
    ],
    howToUse:
      'Apply an even layer to clean face and neck every night before bed. Massage gently until absorbed.',
    size: '50g',
    tags: ['vitamin c', 'night cream', 'moisturizer', 'new'],
    rating: 4.6,
    numReviews: 54,
    sold: 360,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
  }),
  p({
    _id: 'prod_goldcream',
    name: '24K Gold Whitening Cream',
    slug: '24k-gold-whitening-cream',
    shortDescription:
      'Luxury anti-aging whitening cream that reduces wrinkles, fine lines & age spots.',
    description:
      'DailyWish 24K Gold Whitening Cream (Anti-Aging Formula) is an export-quality luxury cream infused with gold and milk extracts. It visibly reduces the appearance of wrinkles, fine lines, age spots and other signs of aging, while delivering a clean, healthy, radiant glow. Feel the difference in just a few days. For all skin types.',
    category: 'whitening',
    categoryName: 'Whitening & Brightening',
    brand: 'DailyWish',
    price: 750,
    comparePrice: 999,
    costPrice: 320,
    sku: 'DW-GC-24K-30',
    stock: 175,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068702/dailywish/products/goldcream-1.jpg', alt: 'DailyWish 24K Gold Whitening Cream', isPrimary: true },
    ],
    variants: [],
    features: [
      '24K gold & milk extract',
      'Anti-aging formula',
      'Reduces wrinkles & fine lines',
      'Fades age spots',
      'Radiant, healthy glow',
    ],
    howToUse:
      'Apply a thin layer to clean face twice daily. For best results use as part of your DailyWish routine.',
    size: '30g',
    tags: ['gold', 'whitening', 'anti-aging', 'best seller'],
    rating: 4.7,
    numReviews: 142,
    sold: 980,
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
  }),
  p({
    _id: 'prod_beautycream',
    name: 'DailyWish Beauty Cream',
    slug: 'beauty-cream',
    shortDescription:
      'Reinvent fair, spotless skin within days - removes melasma, freckles & dark spots.',
    description:
      'DailyWish Beauty Cream is a multi-vitamin whitening cream that helps reduce melasma, freckles, wrinkles and dark spots, revealing fairer, glowing skin within days. Provides everyday skin protection and a flawless finish. Suitable for all skin types.',
    category: 'whitening',
    categoryName: 'Whitening & Brightening',
    brand: 'DailyWish',
    price: 450,
    comparePrice: 600,
    costPrice: 180,
    sku: 'DW-BC-MULTI-30',
    stock: 200,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068696/dailywish/products/beautycream-1.jpg', alt: 'DailyWish Beauty Cream', isPrimary: true },
    ],
    variants: [],
    features: [
      'Multi-vitamin formula',
      'Reduces melasma & freckles',
      'Fades dark spots',
      'Skin protection',
      'Visible results in days',
    ],
    howToUse:
      'Apply a small amount to clean face every night. Use consistently for visible results.',
    size: '30g',
    tags: ['beauty cream', 'whitening', 'fairness'],
    rating: 4.5,
    numReviews: 168,
    sold: 1420,
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
  }),
  p({
    _id: 'prod_antiacne',
    name: 'Anti-Acne Cream',
    slug: 'anti-acne-cream',
    shortDescription:
      'Dermatologist-approved formula that fights pimples, breakouts & redness.',
    description:
      'Say goodbye to acne and hello to clear, confident skin. DailyWish Anti-Acne Cream features a potent, dermatologist-approved formulation that fights pimples and breakouts, reduces redness and inflammation, unclogs pores and prevents future acne. Removes scars and acne blemishes while being gentle on the skin. Suitable for all skin types.',
    category: 'anti-acne',
    categoryName: 'Acne Care',
    brand: 'DailyWish',
    price: 550,
    comparePrice: 700,
    costPrice: 230,
    sku: 'DW-AC-POTENT-30',
    stock: 185,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068693/dailywish/products/antiacne-1.jpg', alt: 'DailyWish Anti-Acne Cream lifestyle', isPrimary: true },
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068694/dailywish/products/antiacne-2.jpg', alt: 'Anti-Acne Cream benefits' },
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068695/dailywish/products/antiacne-3.jpg', alt: 'Anti-Acne Cream before and after' },
    ],
    variants: [],
    features: [
      'Dermatologist-approved formula',
      'Fights pimples & breakouts',
      'Reduces redness & inflammation',
      'Unclogs pores',
      'Removes scars & blemishes',
    ],
    howToUse:
      'Cleanse face and apply a thin layer to affected areas twice daily. Avoid contact with eyes.',
    size: '30g',
    tags: ['anti-acne', 'pimples', 'best seller', 'clear skin'],
    rating: 4.6,
    numReviews: 124,
    sold: 870,
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
  }),
  p({
    _id: 'prod_skinpolish',
    name: 'Ultra Glowing Skin Polish Kit',
    slug: 'ultra-glowing-skin-polish',
    shortDescription:
      '3-in-1 skin polish - Peeling Cream, Blonder Powder & Skin Shiner for a flawless glow.',
    description:
      'DailyWish Ultra Glowing Skin Polish is a complete 3-in-1 kit - Peeling Cream, Blonder Powder and Skin Shiner - that whitens skin and boosts radiance, removes dead skin cells and evens out skin tone to reveal a flawless complexion. Made with 100% natural organic quality ingredients. For all skin types.',
    category: 'skin-polish',
    categoryName: 'Skin Polish & Scrubs',
    brand: 'DailyWish',
    price: 1100,
    comparePrice: 1400,
    costPrice: 480,
    sku: 'DW-SP-ULTRA',
    stock: 95,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068705/dailywish/products/skinpolish-1.jpg', alt: 'DailyWish Ultra Glowing Skin Polish kit', isPrimary: true },
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068706/dailywish/products/skinpolish-2.jpg', alt: 'Skin Polish benefits infographic' },
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068707/dailywish/products/skinpolish-3.jpg', alt: 'Skin Polish kit variants' },
    ],
    variants: [
      { name: 'Size', value: '60ml', sku: 'DW-SP-ULTRA-60', priceDelta: -300, stock: 40 },
      { name: 'Size', value: '100ml', sku: 'DW-SP-ULTRA-100', priceDelta: 0, stock: 35 },
      { name: 'Size', value: '200ml', sku: 'DW-SP-ULTRA-200', priceDelta: 500, stock: 20 },
    ],
    features: [
      '3-in-1: Peeling Cream + Blonder Powder + Skin Shiner',
      'Whitens skin & boosts radiance',
      'Removes dead skin cells',
      'Evens out skin tone',
      '100% natural organic ingredients',
    ],
    howToUse:
      'Apply peeling cream, gently massage to remove dead cells, rinse. Follow with blonder powder mix, then finish with skin shiner. Use weekly.',
    size: '100ml',
    tags: ['skin polish', 'scrub', 'glow', 'featured'],
    rating: 4.8,
    numReviews: 73,
    sold: 410,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
  }),
  p({
    _id: 'prod_bleach',
    name: 'Vitamin C Cream Bleach',
    slug: 'vitamin-c-cream-bleach',
    shortDescription:
      'Instant skin glow cream bleach with brightening serum - fast, gentle & effective.',
    description:
      'DailyWish Instant Skin Glow Vitamin C Cream Bleach with brightening serum gently lightens facial hair and instantly brightens the skin for a visibly fairer, glowing finish. Fast, gentle and effective - your secret to an instant glow before any occasion.',
    category: 'whitening',
    categoryName: 'Whitening & Brightening',
    brand: 'DailyWish',
    price: 350,
    comparePrice: 450,
    costPrice: 140,
    sku: 'DW-BL-VITC',
    stock: 260,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068697/dailywish/products/bleach-1.jpg', alt: 'DailyWish Vitamin C Cream Bleach', isPrimary: true },
    ],
    variants: [],
    features: [
      'Instant skin glow',
      'With brightening serum',
      'Lightens facial hair',
      'Fast, gentle & effective',
    ],
    howToUse:
      'Mix bleach cream with activator as directed. Apply evenly, leave for 10 minutes, then remove. Do a patch test first.',
    size: 'Sachet',
    tags: ['bleach', 'vitamin c', 'instant glow'],
    rating: 4.4,
    numReviews: 61,
    sold: 720,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
  }),
  p({
    _id: 'prod_bundle5in1',
    name: '5-in-1 Wedding Season Glow Deal',
    slug: '5-in-1-wedding-season-deal',
    shortDescription:
      'Get ready to glow this wedding season - 5 DailyWish bestsellers in one value bundle.',
    description:
      'The DailyWish 5-in-1 Hot Deal brings together our wedding-season essentials: Beauty Cream, 24K Gold Whitening Cream, Ultra Glowing Skin Polish, Anti-Acne Cream and Vitamin C Whitening Face Wash. Everything you need for a complete, radiant bridal glow - at one unbeatable bundle price.',
    category: 'bundles-deals',
    categoryName: 'Bundles & Deals',
    brand: 'DailyWish',
    price: 2999,
    comparePrice: 4200,
    costPrice: 1450,
    sku: 'DW-BND-5IN1',
    stock: 60,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068697/dailywish/products/bundle-1.jpg', alt: 'DailyWish 5-in-1 Wedding Season Hot Deal', isPrimary: true },
    ],
    variants: [],
    features: [
      'Beauty Cream',
      '24K Gold Whitening Cream',
      'Ultra Glowing Skin Polish',
      'Anti-Acne Cream',
      'Vitamin C Whitening Face Wash',
      'Save over 28% vs buying separately',
    ],
    howToUse:
      'Follow each product’s individual usage instructions for a complete day & night glow routine.',
    size: '5-piece set',
    tags: ['bundle', 'deal', 'wedding', 'best seller', 'value'],
    rating: 4.9,
    numReviews: 38,
    sold: 240,
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
  }),
  p({
    _id: 'prod_vitcbundle',
    name: 'Vitamin C Complete Glow Kit',
    slug: 'vitamin-c-complete-glow-kit',
    shortDescription:
      'Face Wash + Serum + Night Cream - the full Vitamin C journey for radiant skin.',
    description:
      'Discover your full Vitamin C journey with the DailyWish Complete Glow Kit: Vitamin C Whitening Face Wash, Whitening Serum and Night Cream. A complete day-to-night routine engineered for glow, hydration and clarity.',
    category: 'bundles-deals',
    categoryName: 'Bundles & Deals',
    brand: 'DailyWish',
    price: 2500,
    comparePrice: 3050,
    costPrice: 1230,
    sku: 'DW-BND-VITC3',
    stock: 70,
    images: [
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068704/dailywish/products/serum-1.jpg', alt: 'DailyWish Vitamin C Complete Glow Kit', isPrimary: true },
      { url: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068698/dailywish/products/facewash-1.jpg', alt: 'Vitamin C Face Wash' },
    ],
    variants: [],
    features: [
      'Vitamin C Whitening Face Wash 120ml',
      'Vitamin C Whitening Serum 30ml',
      'Vitamin C Night Cream 50g',
      'Complete day & night routine',
    ],
    howToUse:
      'Cleanse with the face wash, apply serum, then seal with night cream every evening.',
    size: '3-piece set',
    tags: ['bundle', 'vitamin c', 'kit', 'glow'],
    rating: 4.8,
    numReviews: 29,
    sold: 180,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
  }),
];

export const testimonials: Testimonial[] = [
  {
    _id: 'test_1',
    name: 'Ayesha Khan',
    role: 'Verified Buyer - Islamabad',
    avatar: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068712/dailywish/testimonials/t-1.jpg',
    rating: 5,
    quote:
      'The Vitamin C Face Wash completely changed my skin! Within two weeks my dark spots faded and my face looks so fresh and glowing. Highly recommend DailyWish.',
    isActive: true,
    order: 1,
  },
  {
    _id: 'test_2',
    name: 'Sana Malik',
    role: 'Verified Buyer - Lahore',
    avatar: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068713/dailywish/testimonials/t-2.jpg',
    rating: 5,
    quote:
      'I tried the Cream Bleach before my sister’s wedding and the instant glow was unreal. Gentle on my skin and the results lasted for days.',
    isActive: true,
    order: 2,
  },
  {
    _id: 'test_3',
    name: 'Hina Raza',
    role: 'Verified Buyer - Peshawar',
    avatar: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068714/dailywish/testimonials/t-3.jpg',
    rating: 4,
    quote:
      'The Anti-Acne Cream is the only thing that worked for my breakouts. Affordable, effective and delivered quickly. Will buy again!',
    isActive: true,
    order: 3,
  },
];

export const banners: Banner[] = [
  {
    _id: 'ban_hero1',
    title: 'Make Your Skin Soft, Clear & Glow',
    subtitle: 'Vitamin C Whitening Face Wash - for fair & glowing skin.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068707/dailywish/banners/hero-1.jpg',
    ctaLabel: 'Shop Vitamin C',
    ctaHref: '/shop?category=face-wash',
    placement: 'hero',
    isActive: true,
    order: 1,
  },
  {
    _id: 'ban_hero2',
    title: 'For Complete Skin Repair',
    subtitle: '100% natural ingredients you can trust, every single day.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068708/dailywish/banners/hero-2.jpg',
    ctaLabel: 'Discover More',
    ctaHref: '/shop',
    placement: 'hero',
    isActive: true,
    order: 2,
  },
  {
    _id: 'ban_promo1',
    title: '5-in-1 Wedding Season Deal',
    subtitle: 'Get ready to glow - save over 28%.',
    image: 'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068710/dailywish/banners/promo-1.jpg',
    ctaLabel: 'Grab the Deal',
    ctaHref: '/product/5-in-1-wedding-season-deal',
    placement: 'promo',
    isActive: true,
    order: 1,
  },
];
