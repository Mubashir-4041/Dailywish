'use client';
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, Sparkles, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import type { Banner } from '@/types';

export function Hero({
  banners,
  freeShippingThreshold = 2500,
}: {
  banners: Banner[];
  freeShippingThreshold?: number;
}) {
  const slides = banners.length ? banners : FALLBACK;
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const slide = slides[active]!;

  return (
    <section className="relative isolate overflow-hidden bg-background">
      <HeroBackground />

      <div className="container relative z-10 grid items-stretch gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* Copy */}
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold text-amber-700 backdrop-blur">
                <Sparkles className="h-4 w-4" /> Advanced Formula · 100% Natural
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="mt-4 max-w-md text-lg text-muted-foreground">
                  {slide.subtitle}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href={slide.ctaHref ?? '/shop'}>
                {slide.ctaLabel ?? 'Shop Now'} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/shop?sort=bestselling">Best Sellers</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Trust
              icon={<Truck className="h-5 w-5 text-primary" />}
              label={`Free delivery over ${formatPrice(freeShippingThreshold)}`}
            />
            <Trust
              icon={<ShieldCheck className="h-5 w-5 text-primary" />}
              label="Cash on Delivery"
            />
            <Trust
              icon={<Sparkles className="h-5 w-5 text-primary" />}
              label="Dermatologist tested"
            />
          </div>

          {/* Dots */}
          {slides.length > 1 && (
            <div className="mt-8 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === active ? 'w-8 bg-primary' : 'w-2 bg-primary/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product showcase */}
        <HeroShowcase freeShippingThreshold={freeShippingThreshold} />
      </div>
    </section>
  );
}

/* ---------- Designed product showcase (replaces raw banner image) ---------- */

function HeroShowcase({
  freeShippingThreshold,
}: {
  freeShippingThreshold: number;
}) {
  const reduce = useReducedMotion();
  const float = (delay: number) =>
    reduce ? undefined : { y: [0, -10, 0], transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay } };

  return (
    <div className="relative flex min-h-[24rem] items-center justify-center lg:min-h-[34rem]">
      {/* Soft golden glow behind the card */}
      <div className="absolute h-[80%] w-[80%] rounded-full bg-gradient-to-tr from-accent/35 via-amber-200/30 to-blush-200/40 blur-3xl" />

      {/* Main product card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative aspect-[4/5] w-full max-w-[20rem] overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl ring-1 ring-black/5 sm:max-w-sm"
      >
        <Image
          src={HERO_IMAGE}
          alt="DailyWish Vitamin C Whitening Face Wash"
          fill
          priority
          sizes="(max-width: 1024px) 80vw, 28rem"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-90">
              Bestseller
            </p>
            <p className="font-display text-lg font-semibold leading-tight">
              Vitamin C Face Wash
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> 100% Natural
          </span>
        </div>
      </motion.div>

      {/* Floating glass accent chips */}
      <motion.div
        animate={float(0)}
        className="pointer-events-none absolute -left-2 top-8 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 shadow-xl backdrop-blur-md sm:flex lg:-left-6"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold">4.9 / 5</p>
          <p className="text-[11px] text-muted-foreground">2,000+ reviews</p>
        </div>
      </motion.div>

      <motion.div
        animate={float(1.2)}
        className="pointer-events-none absolute -right-2 bottom-24 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 shadow-xl backdrop-blur-md sm:flex lg:-right-6"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
          <Truck className="h-4 w-4 text-primary" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold">Free delivery</p>
          <p className="text-[11px] text-muted-foreground">
            over {formatPrice(freeShippingThreshold)}
          </p>
        </div>
      </motion.div>

      <motion.div
        animate={float(0.6)}
        className="pointer-events-none absolute -bottom-3 left-6 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 shadow-xl backdrop-blur-md sm:flex"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
          <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
        </span>
        <p className="text-sm font-semibold">
          10,000+ <span className="font-normal text-muted-foreground">glowing customers</span>
        </p>
      </motion.div>
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 font-medium text-foreground/80">
      {icon}
      {label}
    </div>
  );
}

/* ---------- Animated aurora background (React-Bits style) ---------- */

function HeroBackground() {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Signature golden radiance */}
      <div className="absolute inset-0 bg-radiance" />
      {/* Subtle dot-grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.04)_1px,transparent_0)] [background-size:24px_24px]" />

      {/* Floating aurora orbs */}
      <Orb
        className="bg-brand-300/40"
        style={{ top: '-6rem', left: '-4rem', width: '24rem', height: '24rem' }}
        reduce={!!reduce}
        dur={14}
        dx={60}
        dy={40}
      />
      <Orb
        className="bg-pink-300/40"
        style={{ top: '25%', right: '-7rem', width: '27rem', height: '27rem' }}
        reduce={!!reduce}
        dur={18}
        dx={-55}
        dy={65}
      />
      <Orb
        className="bg-amber-200/50"
        style={{ bottom: '-8rem', left: '28%', width: '22rem', height: '22rem' }}
        reduce={!!reduce}
        dur={16}
        dx={45}
        dy={-50}
      />

      {/* Twinkling glow dots */}
      {TWINKLES.map((t, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-gold-400 shadow-[0_0_10px_2px_rgba(212,168,67,0.45)]"
          style={{ top: t.top, left: t.left, width: t.size, height: t.size }}
          animate={reduce ? undefined : { opacity: [0.15, 1, 0.15], scale: [0.7, 1.3, 0.7] }}
          transition={{ duration: t.dur, repeat: Infinity, ease: 'easeInOut', delay: t.delay }}
        />
      ))}
    </div>
  );
}

function Orb({
  className,
  style,
  reduce,
  dur,
  dx,
  dy,
}: {
  className: string;
  style: React.CSSProperties;
  reduce: boolean;
  dur: number;
  dx: number;
  dy: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      style={style}
      animate={reduce ? undefined : { x: [0, dx, 0], y: [0, dy, 0], scale: [1, 1.12, 1] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// Curated, chrome-free product shot for the hero showcase (admin banner images
// are often raw phone screenshots, so the visual is decoupled from them).
const HERO_IMAGE =
  'https://res.cloudinary.com/dhhdw3vzp/image/upload/v1782068701/dailywish/products/facewash-4.jpg';

// Fixed positions (no Math.random) to keep SSR and client markup in sync.
const TWINKLES = [
  { top: '16%', left: '10%', size: '7px', dur: 3.4, delay: 0 },
  { top: '30%', left: '46%', size: '5px', dur: 4.2, delay: 0.6 },
  { top: '68%', left: '18%', size: '6px', dur: 3.8, delay: 1.1 },
  { top: '22%', left: '82%', size: '5px', dur: 4.6, delay: 0.3 },
  { top: '74%', left: '60%', size: '7px', dur: 3.2, delay: 1.4 },
  { top: '52%', left: '92%', size: '5px', dur: 4.0, delay: 0.9 },
];

const FALLBACK: Banner[] = [
  {
    _id: 'f1',
    title: 'Make Your Skin Soft, Clear & Glow',
    subtitle: 'Premium Vitamin C skincare for fair & glowing skin.',
    image: '/banners/hero-1.jpeg',
    ctaLabel: 'Shop Now',
    ctaHref: '/shop',
    placement: 'hero',
    isActive: true,
    order: 1,
  },
];
