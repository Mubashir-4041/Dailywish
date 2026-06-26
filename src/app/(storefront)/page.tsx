import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Hero } from '@/components/storefront/hero';
import { ValueProps } from '@/components/storefront/value-props';
import { CategoryShowcase } from '@/components/storefront/category-showcase';
import { Testimonials } from '@/components/storefront/testimonials';
import { ProductGrid } from '@/components/storefront/product-grid';
import { SectionHeading } from '@/components/storefront/section-heading';
import { Button } from '@/components/ui/button';
import {
  getBanners,
  getBestSellers,
  getCategories,
  getFeaturedProducts,
  getNewArrivals,
  getTestimonials,
} from '@/server/catalog';
import { getSiteSettings } from '@/server/settings';

export const revalidate = 300; // ISR - refresh homepage every 5 minutes

export default async function HomePage() {
  const [heroBanners, promo, categories, featured, bestSellers, newArrivals, testimonials, settings] =
    await Promise.all([
      getBanners('hero'),
      getBanners('promo'),
      getCategories(),
      getFeaturedProducts(8),
      getBestSellers(8),
      getNewArrivals(4),
      getTestimonials(),
      getSiteSettings(),
    ]);

  const promoBanner = promo[0];

  return (
    <>
      <Hero
        banners={heroBanners}
        freeShippingThreshold={settings.freeShippingThreshold}
      />

      {/* Value props */}
      <section className="container py-12">
        <ValueProps />
      </section>

      {/* Categories */}
      <section className="container py-8">
        <SectionHeading
          eyebrow="Explore"
          title="Shop by Category"
          description="Find the right routine for your skin."
          href="/categories"
        />
        <CategoryShowcase categories={categories} />
      </section>

      {/* Featured */}
      <section className="container py-12">
        <SectionHeading
          eyebrow="Handpicked"
          title="Featured Products"
          description="Our most-loved DailyWish essentials."
          href="/shop?sort=featured"
        />
        <ProductGrid products={featured} />
      </section>

      {/* Promo banner */}
      {promoBanner && (
        <section className="container py-8">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-primary to-brand-700 text-primary-foreground">
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div className="p-8 md:p-12">
                <h2 className="font-display text-3xl font-bold sm:text-4xl">
                  {promoBanner.title}
                </h2>
                {promoBanner.subtitle && (
                  <p className="mt-3 text-lg text-primary-foreground/90">
                    {promoBanner.subtitle}
                  </p>
                )}
                <Button size="lg" variant="accent" className="mt-6" asChild>
                  <Link href={promoBanner.ctaHref ?? '/shop'}>
                    {promoBanner.ctaLabel ?? 'Shop the Deal'} <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="relative hidden aspect-[16/10] md:block">
                <Image
                  src={promoBanner.image}
                  alt={promoBanner.title}
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Best sellers */}
      <section className="container py-12">
        <SectionHeading
          eyebrow="Trending"
          title="Best Sellers"
          description="What everyone's adding to cart right now."
          href="/shop?sort=bestselling"
        />
        <ProductGrid products={bestSellers} />
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="container py-8">
          <SectionHeading
            eyebrow="Fresh"
            title="New Arrivals"
            href="/shop?sort=newest"
          />
          <ProductGrid products={newArrivals} />
        </section>
      )}

      {/* Testimonials */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <SectionHeading
            eyebrow="Reviews"
            title="Loved by Our Customers"
            description="Real results from real DailyWish customers across Pakistan."
            align="center"
          />
          <Testimonials testimonials={testimonials} />
        </div>
      </section>
    </>
  );
}
