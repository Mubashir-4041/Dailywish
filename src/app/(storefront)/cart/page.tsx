'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/components/providers/cart-provider';
import { formatPrice } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export default function CartPage() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="rounded-full bg-muted p-8">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">Looks like you haven&apos;t added anything yet.</p>
        <Button size="lg" asChild>
          <Link href="/shop">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Shopping Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="space-y-4">
          {cart.items.map((item) => {
            const key = cart.lineKey(item);
            return (
              <Card key={key}>
                <CardContent className="flex gap-4 p-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/product/${item.slug}`} className="font-semibold hover:text-primary">
                      {item.name}
                    </Link>
                    {item.variant && (
                      <span className="text-sm text-muted-foreground">
                        {item.variant.name}: {item.variant.value}
                      </span>
                    )}
                    <span className="mt-1 text-sm font-medium text-primary">
                      {formatPrice(item.price)}
                    </span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-md border">
                        <button className="px-2.5 py-1.5 hover:bg-muted" onClick={() => cart.updateQty(key, item.quantity - 1)} aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm">{item.quantity}</span>
                        <button className="px-2.5 py-1.5 hover:bg-muted" onClick={() => cart.updateQty(key, item.quantity + 1)} aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                        <button className="text-muted-foreground hover:text-destructive" onClick={() => cart.removeItem(key)} aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Button variant="ghost" className="text-destructive" onClick={cart.clear}>
            Clear cart
          </Button>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-28">
            <CardContent className="space-y-4 p-6">
              <h2 className="font-semibold">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)}
                  </span>
                </div>
                {cart.subtotal < siteConfig.shipping.freeThreshold && (
                  <p className="flex items-center gap-1.5 rounded-md bg-accent/10 p-2 text-xs text-amber-700">
                    <Tag className="h-3.5 w-3.5" />
                    Add {formatPrice(siteConfig.shipping.freeThreshold - cart.subtotal)} for free shipping!
                  </p>
                )}
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <Button size="lg" className="w-full" asChild>
                <Link href="/checkout">
                  Proceed to Checkout <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
