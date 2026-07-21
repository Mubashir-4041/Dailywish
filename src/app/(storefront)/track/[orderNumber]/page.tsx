'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Check,
  CreditCard,
  Loader2,
  MapPin,
  PackageX,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types';

interface OrderDetail {
  _id: string;
  orderNumber: string;
  email: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string;
  notes?: string;
  items: {
    name: string;
    slug: string;
    image: string;
    price: number;
    quantity: number;
    variant?: { name: string; value: string };
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode?: string;
    country: string;
  };
}

const TIMELINE: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const statusLabel: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const paymentMethodLabel: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
  stripe: 'Card (Stripe)',
  paypal: 'PayPal',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
};

function TrackContent() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;
  const search = useSearchParams();
  const token = search.get('token') ?? '';

  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  // When there's no token (e.g. someone opened /track/NUM directly), we fall
  // back to an email prompt so they can still look up their own order.
  const [needsEmail, setNeedsEmail] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (emailInput?: string) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (token) qs.set('token', token);
        if (emailInput) qs.set('email', emailInput);
        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber)}?${qs.toString()}`,
        );
        const data = (await res.json()) as { order?: OrderDetail; error?: string };
        if (!res.ok) {
          if (res.status === 403 || res.status === 404) {
            // Not authorized / not found by the current credentials — offer the
            // email lookup instead of a dead end.
            setNeedsEmail(true);
            setError(
              emailInput
                ? 'That email doesn’t match this order. Please check and try again.'
                : null,
            );
          } else {
            setError(data.error ?? 'Could not load this order.');
          }
          setOrder(null);
          return;
        }
        setOrder(data.order ?? null);
        setNeedsEmail(false);
      } catch {
        setError('Could not load this order.');
      } finally {
        setLoading(false);
      }
    },
    [orderNumber, token],
  );

  React.useEffect(() => {
    if (token) load();
    else {
      setLoading(false);
      setNeedsEmail(true);
    }
  }, [token, load]);

  if (loading) {
    return (
      <div className="container max-w-3xl space-y-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Email-lookup fallback.
  if (needsEmail && !order) {
    return (
      <div className="container flex min-h-[60vh] max-w-md flex-col justify-center py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-primary" />
              Track your order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Enter the email you used for order{' '}
              <span className="font-mono font-medium">{orderNumber}</span> to view its status.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) load(email.trim());
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="lookup-email">Email</Label>
                <Input
                  id="lookup-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full">
                View order
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container max-w-3xl py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <PackageX className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">{error ?? 'Order not found'}</p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  const currentStep = TIMELINE.indexOf(order.status);

  return (
    <div className="container max-w-3xl space-y-6 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={isCancelled ? 'destructive' : 'success'} className="w-fit capitalize">
          {statusLabel[order.status]}
        </Badge>
      </div>

      {/* Status timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order status</CardTitle>
        </CardHeader>
        <CardContent>
          {isCancelled ? (
            <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              This order has been {order.status}.
            </p>
          ) : (
            <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
              {TIMELINE.map((step, idx) => {
                const reached = idx <= currentStep;
                const isLast = idx === TIMELINE.length - 1;
                return (
                  <li
                    key={step}
                    className="relative flex flex-1 items-center gap-3 sm:flex-col sm:items-center sm:text-center"
                  >
                    <span
                      className={cn(
                        'z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        reached
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted bg-background text-muted-foreground',
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                    {!isLast ? (
                      <span
                        className={cn(
                          'absolute left-4 top-9 h-full w-0.5 sm:left-1/2 sm:top-4 sm:h-0.5 sm:w-full sm:translate-x-0',
                          idx < currentStep ? 'bg-primary' : 'bg-muted',
                        )}
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={cn(
                        'pb-6 text-sm font-medium sm:pb-0 sm:pt-2',
                        reached ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {statusLabel[step]}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y">
            {order.items.map((item, idx) => (
              <li key={`${item.slug}-${idx}`} className="flex gap-4 py-4 first:pt-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.variant ? (
                    <p className="text-xs text-muted-foreground">
                      {item.variant.name}: {item.variant.value}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </li>
            ))}
          </ul>

          <Separator />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{order.shipping > 0 ? formatPrice(order.shipping) : 'Free'}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between text-emerald-600">
                <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
                <dd>−{formatPrice(order.discount)}</dd>
              </div>
            ) : null}
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Shipping address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.phone}</p>
            <p className="mt-1">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.region}
              {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ''}
            </p>
            <p>{order.shippingAddress.country}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Method</span>
              <span className="font-medium text-foreground">
                {paymentMethodLabel[order.paymentMethod]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge
                variant={order.paymentStatus === 'paid' ? 'success' : 'secondary'}
                className="capitalize"
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Need to change or cancel this order?{' '}
        <Link href="/contact" className="font-medium text-primary hover:underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex min-h-[50vh] items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
