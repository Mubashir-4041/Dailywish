'use client';
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatPrice, discountPercent } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/rating';
import { useCart } from '@/components/providers/cart-provider';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { ImagePlaceholder } from '@/components/storefront/image-placeholder';
import type { Product } from '@/types';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const [imgBroken, setImgBroken] = React.useState(false);
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const secondary = product.images[1];
  const showPlaceholder = !primary || imgBroken;
  const discount = discountPercent(product.price, product.comparePrice);
  const inWishlist = wishlist.has(product._id);
  const soldOut = product.stock <= 0;

  function addToCart() {
    if (soldOut) return;
    cart.addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: primary?.url ?? '',
      price: product.price,
      maxStock: product.stock,
    });
    toast.success(`${product.name} added to cart`);
  }

  function toggleWishlist() {
    wishlist.toggle({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: primary?.url ?? '',
      price: product.price,
    });
    toast(inWishlist ? 'Removed from wishlist' : 'Saved to wishlist ❤️');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-glow transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-lg"
    >
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted">
        {showPlaceholder && <ImagePlaceholder label={product.name} />}
        {primary && !imgBroken && (
          <Image
            src={primary.url}
            alt={primary.alt || product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgBroken(true)}
            className={cn(
              'object-cover transition-all duration-500 group-hover:scale-105',
              secondary && 'group-hover:opacity-0',
            )}
          />
        )}
        {secondary && !imgBroken && (
          <Image
            src={secondary.url}
            alt={secondary.alt || product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discount > 0 && <Badge variant="accent">-{discount}%</Badge>}
          {product.isNewArrival && <Badge variant="success">New</Badge>}
          {product.isBestSeller && <Badge>Best Seller</Badge>}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Badge variant="destructive" className="text-sm">Sold Out</Badge>
          </div>
        )}

        {/* Quick actions */}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist();
            }}
            aria-label="Toggle wishlist"
            className={cn(
              'rounded-full bg-background/90 p-2 shadow transition-colors hover:bg-background',
              inWishlist && 'text-red-500',
            )}
          >
            <Heart className="h-4 w-4" fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
          <span className="rounded-full bg-background/90 p-2 shadow">
            <Eye className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.categoryName}
        </span>
        <Link
          href={`/product/${product.slug}`}
          className="mt-1 line-clamp-2 text-sm font-semibold leading-snug hover:text-primary"
        >
          {product.name}
        </Link>
        {product.numReviews > 0 && (
          <Rating value={product.rating} count={product.numReviews} className="mt-1.5" size={14} />
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">{formatPrice(product.price)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>

        <Button
          onClick={addToCart}
          disabled={soldOut}
          size="sm"
          className="mt-3 w-full"
          variant={soldOut ? 'secondary' : 'default'}
        >
          <ShoppingBag className="h-4 w-4" />
          {soldOut ? 'Sold Out' : 'Add to Cart'}
        </Button>
      </div>
    </motion.div>
  );
}
