'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, ArrowRight, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/components/providers/cart-provider';

type PayState = 'loading' | 'paid' | 'processing' | 'failed' | 'placed';

function SuccessContent() {
  const params = useSearchParams();
  const order = params.get('order') ?? undefined;
  const paymentIntent = params.get('payment_intent') ?? undefined;
  const track = params.get('t') ?? undefined;
  const cart = useCart();

  // Guests have no dashboard — send them to the token-based tracking page. A
  // logged-in customer still gets their order under /account/orders.
  const trackHref =
    order && track
      ? `/track/${encodeURIComponent(order)}?token=${encodeURIComponent(track)}`
      : '/account/orders';

  // The order is placed regardless of online-payment outcome, so the cart is
  // done — clear it once on mount.
  const cleared = React.useRef(false);
  React.useEffect(() => {
    if (!cleared.current) {
      cleared.current = true;
      cart.clear();
    }
  }, [cart]);

  // If we returned from Stripe, verify the payment server-side (idempotent).
  const [state, setState] = React.useState<PayState>(paymentIntent ? 'loading' : 'placed');
  React.useEffect(() => {
    if (!paymentIntent || !order) return;
    let active = true;
    fetch('/api/checkout/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: order, paymentIntentId: paymentIntent }),
    })
      .then((r) => (r.ok ? r.json() : { paid: false, status: 'error' }))
      .then((d: { paid?: boolean; status?: string }) => {
        if (!active) return;
        if (d.paid) setState('paid');
        else if (d.status === 'processing' || d.status === 'requires_action') setState('processing');
        else setState('failed');
      })
      .catch(() => active && setState('failed'));
    return () => {
      active = false;
    };
  }, [paymentIntent, order]);

  const ui = {
    loading: {
      icon: <Loader2 className="h-9 w-9 animate-spin text-primary" />,
      tone: 'bg-primary/10',
      title: 'Confirming your payment…',
      body: 'Hang tight while we verify your card payment with Stripe.',
    },
    paid: {
      icon: <CheckCircle2 className="h-9 w-9 text-emerald-600" />,
      tone: 'bg-emerald-100',
      title: 'Payment received — thank you!',
      body: 'Your order is confirmed and a receipt is on its way to your email.',
    },
    placed: {
      icon: <CheckCircle2 className="h-9 w-9 text-emerald-600" />,
      tone: 'bg-emerald-100',
      title: 'Thank you for your order!',
      body: 'Your order has been placed successfully. A confirmation email is on its way.',
    },
    processing: {
      icon: <Clock className="h-9 w-9 text-amber-600" />,
      tone: 'bg-amber-100',
      title: 'Payment is processing',
      body: "Your bank is finalising the payment. We'll email you once it clears — no action needed.",
    },
    failed: {
      icon: <AlertTriangle className="h-9 w-9 text-destructive" />,
      tone: 'bg-destructive/10',
      title: "Payment didn't go through",
      body: 'Your order was placed but payment is unpaid. You can retry from your orders, or it can be paid as Cash on Delivery.',
    },
  }[state];

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-16">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${ui.tone}`}>
            {ui.icon}
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">{ui.title}</h1>
          <p className="mt-2 text-muted-foreground">{ui.body}</p>
          {order && (
            <div className="mt-4 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Order Number</p>
              <p className="font-mono text-lg font-bold">{order}</p>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
              <Link href={trackHref}>
                <Package className="h-4 w-4" /> Track Your Order
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/shop">
                Continue Shopping <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
