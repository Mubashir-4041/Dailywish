'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Heart, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/providers/cart-provider';
import { useWishlist } from '@/components/providers/wishlist-provider';
import type { Product } from '@/types';

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const cart = useCart();
  const wishlist = useWishlist();
  const [qty, setQty] = React.useState(1);
  const [variantSku, setVariantSku] = React.useState(
    product.variants[0]?.sku ?? '',
  );

  const variant = product.variants.find((v) => v.sku === variantSku);
  const price = product.price + (variant?.priceDelta ?? 0);
  const stock = variant?.stock ?? product.stock;
  const soldOut = stock <= 0;
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const inWishlist = wishlist.has(product._id);

  function buildLine() {
    return {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: primary?.url ?? '',
      price,
      maxStock: stock,
      variant: variant
        ? { name: variant.name, value: variant.value, sku: variant.sku }
        : undefined,
    };
  }

  function addToCart() {
    cart.addItem(buildLine(), qty);
    toast.success(`${product.name} added to cart`);
  }

  function buyNow() {
    cart.addItem(buildLine(), qty);
    router.push('/checkout');
  }

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-primary">{formatPrice(price)}</span>
        {product.comparePrice && product.comparePrice > price && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(product.comparePrice)}
            </span>
            <Badge variant="accent">
              Save {formatPrice(product.comparePrice - price)}
            </Badge>
          </>
        )}
      </div>

      {/* Stock */}
      <div className="flex items-center gap-2 text-sm">
        {soldOut ? (
          <Badge variant="destructive">Out of stock</Badge>
        ) : (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <Check className="h-4 w-4" /> In stock
            {stock <= 10 && <span className="text-amber-600"> · only {stock} left</span>}
          </span>
        )}
      </div>

      {/* Variants */}
      {product.variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">
            {product.variants[0]!.name}:{' '}
            <span className="text-muted-foreground">{variant?.value}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.sku}
                onClick={() => setVariantSku(v.sku)}
                disabled={v.stock <= 0}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40',
                  v.sku === variantSku
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-input hover:border-primary',
                )}
              >
                {v.value}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border">
          <button
            className="px-3 py-2.5 hover:bg-muted"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center font-medium">{qty}</span>
          <button
            className="px-3 py-2.5 hover:bg-muted"
            onClick={() => setQty((q) => Math.min(stock || 99, q + 1))}
            aria-label="Increase"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <Button
          variant={inWishlist ? 'secondary' : 'outline'}
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Add to wishlist"
          onClick={() => {
            wishlist.toggle({
              productId: product._id,
              slug: product.slug,
              name: product.name,
              image: primary?.url ?? '',
              price,
            });
            toast(inWishlist ? 'Removed from wishlist' : 'Saved to wishlist ❤️');
          }}
        >
          <Heart className="h-5 w-5" fill={inWishlist ? 'currentColor' : 'none'} />
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" disabled={soldOut} onClick={addToCart}>
          <ShoppingBag className="h-5 w-5" /> Add to Cart
        </Button>
        <Button
          size="lg"
          variant="accent"
          className="flex-1"
          disabled={soldOut}
          onClick={buyNow}
        >
          <Zap className="h-5 w-5" /> Buy Now
        </Button>
      </div>
    </div>
  );
}
