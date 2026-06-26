'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/components/providers/cart-provider';
import { formatPrice } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export function CartDrawer() {
  const cart = useCart();

  return (
    <Sheet open={cart.isOpen} onOpenChange={cart.setOpen}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({cart.count})
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-muted p-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Add some glow to your routine.
              </p>
            </div>
            <Button onClick={() => cart.setOpen(false)} asChild>
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="-mx-6 flex-1 overflow-y-auto px-6">
              <ul className="divide-y">
                {cart.items.map((item) => {
                  const key = cart.lineKey(item);
                  return (
                    <li key={key} className="flex gap-4 py-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={() => cart.setOpen(false)}
                          className="line-clamp-2 text-sm font-medium hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        {item.variant && (
                          <span className="text-xs text-muted-foreground">
                            {item.variant.name}: {item.variant.value}
                          </span>
                        )}
                        <span className="mt-1 text-sm font-semibold text-primary">
                          {formatPrice(item.price)}
                        </span>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center rounded-md border">
                            <button
                              aria-label="Decrease quantity"
                              className="px-2 py-1 hover:bg-muted"
                              onClick={() => cart.updateQty(key, item.quantity - 1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              aria-label="Increase quantity"
                              className="px-2 py-1 hover:bg-muted"
                              onClick={() => cart.updateQty(key, item.quantity + 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            aria-label="Remove item"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => cart.removeItem(key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <SheetFooter>
              <Separator />
              <div className="space-y-1.5 py-2 text-sm">
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
                  <p className="text-xs text-muted-foreground">
                    Add {formatPrice(siteConfig.shipping.freeThreshold - cart.subtotal)} more
                    for free shipping.
                  </p>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>
              <Button size="lg" className="w-full" asChild onClick={() => cart.setOpen(false)}>
                <Link href="/checkout">
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => cart.setOpen(false)}>
                Continue Shopping
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
