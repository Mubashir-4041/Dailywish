'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { useCart } from '@/components/providers/cart-provider';
import { formatPrice } from '@/lib/utils';

export default function WishlistPage() {
  const wishlist = useWishlist();
  const cart = useCart();

  if (wishlist.items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="rounded-full bg-muted p-8">
          <Heart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold">Your wishlist is empty</h1>
        <p className="text-muted-foreground">Save your favourites to find them here later.</p>
        <Button size="lg" asChild>
          <Link href="/shop">Explore Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          My Wishlist ({wishlist.count})
        </h1>
        <Button variant="ghost" className="text-destructive" onClick={wishlist.clear}>
          Clear all
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {wishlist.items.map((item) => (
          <Card key={item.productId} className="overflow-hidden">
            <Link href={`/product/${item.slug}`} className="relative block aspect-square bg-muted">
              <Image src={item.image} alt={item.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform hover:scale-105" />
            </Link>
            <CardContent className="p-4">
              <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-primary">
                {item.name}
              </Link>
              <p className="mt-1 font-bold text-primary">{formatPrice(item.price)}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    cart.addItem({
                      productId: item.productId,
                      slug: item.slug,
                      name: item.name,
                      image: item.image,
                      price: item.price,
                      maxStock: 99,
                    });
                    toast.success('Added to cart');
                  }}
                >
                  <ShoppingBag className="h-4 w-4" /> Add
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => wishlist.remove(item.productId)}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
