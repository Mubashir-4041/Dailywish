import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Droplets,
  Heart,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'The story of DailyWish by Majid Cosmetics - premium Vitamin C skincare crafted in Pakistan for fair, healthy, glowing skin. Discover our mission, values and store locations.',
  alternates: { canonical: '/about' },
};

const stats = [
  { value: `${new Date().getFullYear() - siteConfig.founded}+`, label: 'Years of glow' },
  { value: '25+', label: 'Skincare products' },
  { value: '50k+', label: 'Happy customers' },
  { value: '2', label: 'Retail stores' },
];

const values = [
  {
    icon: Leaf,
    title: 'Clean formulations',
    body: 'Thoughtfully chosen actives like Vitamin C, free from harsh, skin-stripping ingredients.',
  },
  {
    icon: ShieldCheck,
    title: 'Dermatologically minded',
    body: 'Gentle, balanced products designed for everyday use on Pakistani skin tones and climate.',
  },
  {
    icon: Heart,
    title: 'Customer first',
    body: 'Honest advice, responsive support and a glow-back promise on every order.',
  },
  {
    icon: Sparkles,
    title: 'Visible results',
    body: 'Brightening, fading and smoothing routines that deliver a real, lasting daily glow.',
  },
];

const vitaminCHighlights = [
  {
    icon: Sun,
    title: 'Brightens & evens tone',
    body: 'Vitamin C helps fade dark spots and pigmentation for a clearer, more radiant complexion.',
  },
  {
    icon: Droplets,
    title: 'Deep-yet-gentle cleanse',
    body: 'Our whitening face wash lifts away dirt and excess oil without over-drying the skin.',
  },
  {
    icon: ShieldCheck,
    title: 'Antioxidant defence',
    body: 'Daily protection against pollution and environmental stress that dulls your glow.',
  },
];

export default function AboutPage() {
  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto grid items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {siteConfig.legalName}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
              Skincare made for your daily glow
            </h1>
            <p className="mt-4 max-w-prose text-lg text-muted-foreground">
              {siteConfig.name} is a homegrown skincare brand from Khyber Pakhtunkhwa,
              crafting premium Vitamin C formulations that brighten, balance and care for
              everyday skin. Our promise is simple - {siteConfig.tagline.toLowerCase()}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/shop">Shop the range</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Visit a store</Link>
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/banners/hero-2.jpeg"
              alt="DailyWish skincare collection"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="p-6">
                <p className="font-display text-3xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Story + Mission */}
      <section className="container mx-auto grid items-center gap-12 px-4 py-12 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
          <Image
            src="/products/facewash-1.jpeg"
            alt="DailyWish Vitamin C whitening face wash"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-3xl font-bold">Our story</h2>
            <p className="mt-3 text-muted-foreground">
              Founded in {siteConfig.founded} under Majid Cosmetics, {siteConfig.name}{' '}
              began with a single belief - that effective, premium skincare shouldn&apos;t
              be a luxury reserved for the few. From our flagship counters in Swabi and
              Mardan, we grew a loyal community by pairing quality Vitamin C formulations
              with honest guidance.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold">Our mission</h2>
            <p className="mt-3 text-muted-foreground">
              To help every customer achieve fair, healthy, glowing skin with products
              that are effective, affordable and a joy to use - from our whitening face
              wash and serums to creams, anti-acne care and skin polish.
            </p>
          </div>
        </div>
      </section>

      {/* Vitamin C range */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold">
              Why our Vitamin C range is special
            </h2>
            <p className="mt-3 text-muted-foreground">
              Vitamin C is one of skincare&apos;s most loved actives - and it sits at the
              heart of the DailyWish line.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {vitaminCHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold">What we stand for</h2>
          <p className="mt-3 text-muted-foreground">
            The values that shape every product and every interaction.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Locations */}
      <section className="container mx-auto px-4 pb-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold">Visit us in store</h2>
          <p className="mt-3 text-muted-foreground">
            Come say hello at one of our two stores across Khyber Pakhtunkhwa.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {siteConfig.locations.map((loc) => (
            <Card key={loc.id}>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{loc.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{loc.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View on Google Maps →
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-12">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-12 text-center text-primary-foreground sm:px-16">
          <h2 className="font-display text-3xl font-bold">Ready to start glowing?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Discover the DailyWish Vitamin C range and find your perfect daily routine.
          </p>
          <Button asChild size="lg" variant="accent" className="mt-6">
            <Link href="/shop">Shop now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
