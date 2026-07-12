import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Check, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { ProductGallery } from '@/components/storefront/product-gallery';
import { ProductPurchase } from '@/components/storefront/product-purchase';
import { ProductReviews } from '@/components/storefront/product-reviews';
import { ProductGrid } from '@/components/storefront/product-grid';
import { SectionHeading } from '@/components/storefront/section-heading';
import { Rating } from '@/components/ui/rating';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  getProductBySlug,
  getRelatedProducts,
  getAllProductSlugs,
  getApprovedReviews,
} from '@/server/catalog';
import { buildProductMetadata, productJsonLd, breadcrumbJsonLd } from '@/lib/seo';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };
  return buildProductMetadata(product);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product, 4),
    getApprovedReviews(product._id),
  ]);

  return (
    <div className="container py-8">
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, reviews)) }}
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', url: '/' },
              { name: 'Shop', url: '/shop' },
              { name: product.categoryName, url: `/shop?category=${product.category}` },
              { name: product.name, url: `/product/${product.slug}` },
            ]),
          ),
        }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link> /{' '}
        <Link href="/shop" className="hover:text-primary">Shop</Link> /{' '}
        <Link href={`/shop?category=${product.category}`} className="hover:text-primary">
          {product.categoryName}
        </Link>{' '}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Main */}
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            {product.brand}
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          {product.numReviews > 0 && (
            <Rating
              value={product.rating}
              count={product.numReviews}
              showValue
              className="mt-3"
            />
          )}
          <p className="mt-4 text-muted-foreground">{product.shortDescription}</p>
          {product.size && (
            <p className="mt-2 text-sm text-muted-foreground">
              Size: <span className="font-medium text-foreground">{product.size}</span>
            </p>
          )}

          <div className="my-6 h-px bg-border" />
          <ProductPurchase product={product} />

          {/* Assurances */}
          <div className="mt-8 grid grid-cols-3 gap-4 rounded-2xl border bg-muted/30 p-4 text-center text-xs">
            <Assurance icon={<Truck className="h-5 w-5" />} label="Fast Delivery" />
            <Assurance icon={<RotateCcw className="h-5 w-5" />} label="Easy Returns" />
            <Assurance icon={<ShieldCheck className="h-5 w-5" />} label="Secure Checkout" />
          </div>

          {/* Key features */}
          {product.features.length > 0 && (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Details tabs */}
      <div className="mt-14">
        <Tabs defaultValue="description">
          <TabsList className="flex-wrap">
            <TabsTrigger value="description">Description</TabsTrigger>
            {product.ingredients && <TabsTrigger value="ingredients">Ingredients</TabsTrigger>}
            {product.howToUse && <TabsTrigger value="how-to-use">How to Use</TabsTrigger>}
            <TabsTrigger value="reviews">Reviews ({product.numReviews})</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="prose max-w-none text-muted-foreground">
            <p className="leading-relaxed">{product.description}</p>
          </TabsContent>
          {product.ingredients && (
            <TabsContent value="ingredients" className="text-muted-foreground">
              <p className="leading-relaxed">{product.ingredients}</p>
            </TabsContent>
          )}
          {product.howToUse && (
            <TabsContent value="how-to-use" className="text-muted-foreground">
              <p className="leading-relaxed">{product.howToUse}</p>
            </TabsContent>
          )}
          <TabsContent value="reviews">
            <ProductReviews
              productId={product._id}
              initialRating={product.rating}
              initialCount={product.numReviews}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow="You may also like" title="Related Products" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

function Assurance({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}
