'use client';
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Banknote, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn, formatPrice } from '@/lib/utils';
import { useCart } from '@/components/providers/cart-provider';
import { StripePaymentForm } from '@/components/checkout/stripe-payment-form';
import type { PaymentMethod } from '@/types';

const PAYMENTS: { value: PaymentMethod; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives.', icon: Banknote },
  { value: 'stripe', label: 'Card (Stripe)', desc: 'Secure card payment.', icon: CreditCard },
  { value: 'paypal', label: 'PayPal', desc: 'Pay with your PayPal account.', icon: Wallet },
];

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [method, setMethod] = React.useState<PaymentMethod>('cod');
  // When set, the Stripe card step is shown instead of the form.
  const [stripeStep, setStripeStep] = React.useState<{
    clientSecret: string;
    orderNumber: string;
    amount: number;
  } | null>(null);
  const [form, setForm] = React.useState({
    email: '',
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    notes: '',
  });

  // Checkout requires a logged-in user (enforced by middleware) — prefill their
  // contact details so they don't retype them.
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user?: { name?: string; email?: string } } | null) => {
        if (!d?.user) return;
        setForm((f) => ({
          ...f,
          email: f.email || d.user!.email || '',
          fullName: f.fullName || d.user!.name || '',
        }));
      })
      .catch(() => undefined);
  }, []);

  const total = Math.max(0, cart.subtotal + cart.shipping);

  if (cart.items.length === 0 && !loading) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <Button className="mt-4" asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          items: cart.items.map((i) => ({
            productId: i.productId,
            slug: i.slug,
            name: i.name,
            image: i.image,
            price: i.price,
            quantity: i.quantity,
            variant: i.variant,
          })),
          shippingAddress: {
            fullName: form.fullName,
            phone: form.phone,
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            region: form.region,
            postalCode: form.postalCode,
            country: 'Pakistan',
          },
          paymentMethod: method,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');

      // Card (Stripe): the order is created as payment-pending and we now have a
      // PaymentIntent client secret — show the card step and collect/charge the
      // card. The cart is cleared only once the order is settled (success page).
      if (method === 'stripe' && data.payment?.clientSecret) {
        setStripeStep({
          clientSecret: data.payment.clientSecret,
          orderNumber: data.orderNumber,
          amount: data.total ?? total,
        });
        setLoading(false);
        return;
      }

      // COD (and the PayPal stub): nothing to charge online — straight to done.
      cart.clear();
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value }),
  });

  // ── Stripe card step ────────────────────────────────────────────────────
  if (stripeStep) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-5 p-6">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Pay with card</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Order <span className="font-mono font-medium">{stripeStep.orderNumber}</span> ·{' '}
                {formatPrice(stripeStep.amount)}
              </p>
            </div>
            <StripePaymentForm
              clientSecret={stripeStep.clientSecret}
              orderNumber={stripeStep.orderNumber}
              amount={stripeStep.amount}
              onBack={() => setStripeStep(null)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left: details */}
        <div className="space-y-8">
          {/* Contact */}
          <section>
            <h2 className="mb-3 font-semibold">Contact</h2>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="you@example.com" {...field('email')} />
            </div>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="mb-3 font-semibold">Shipping Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" required {...field('fullName')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" required placeholder="03xx-xxxxxxx" {...field('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" required {...field('city')} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="line1">Address</Label>
                <Input id="line1" required placeholder="House #, street, area" {...field('line1')} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="line2">Apartment, suite, etc. (optional)</Label>
                <Input id="line2" {...field('line2')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="region">Province / Region</Label>
                <Input id="region" required placeholder="e.g. Khyber Pakhtunkhwa" {...field('region')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postalCode">Postal Code (optional)</Label>
                <Input id="postalCode" {...field('postalCode')} />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="mb-3 font-semibold">Payment Method</h2>
            <div className="space-y-3">
              {PAYMENTS.map((p) => (
                <label
                  key={p.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                    method === p.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50',
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={p.value}
                    checked={method === p.value}
                    onChange={() => setMethod(p.value)}
                    className="sr-only"
                  />
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', method === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    <p.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-medium">{p.label}</span>
                    <span className="block text-sm text-muted-foreground">{p.desc}</span>
                  </span>
                </label>
              ))}
            </div>
            {method === 'stripe' && (
              <p className="mt-2 text-xs text-muted-foreground">
                You&apos;ll enter your card details securely on the next step. Test card:
                4242 4242 4242 4242, any future date / CVC.
              </p>
            )}
            {method === 'paypal' && (
              <p className="mt-2 text-xs text-muted-foreground">
                PayPal isn&apos;t live yet — your order will be placed as payment-pending.
              </p>
            )}
          </section>

          {/* Notes */}
          <section>
            <Label htmlFor="notes">Order notes (optional)</Label>
            <Textarea id="notes" className="mt-1.5" rows={3} placeholder="Any special instructions…" {...field('notes')} />
          </section>
        </div>

        {/* Right: summary */}
        <div>
          <Card className="sticky top-28">
            <CardContent className="space-y-4 p-6">
              <h2 className="font-semibold">Your Order</h2>
              <ul className="max-h-64 space-y-3 overflow-y-auto">
                {cart.items.map((item) => {
                  const key = cart.lineKey(item);
                  return (
                    <li key={key} className="flex gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                        <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="line-clamp-2 text-sm">{item.name}</span>
                        <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `Place Order · ${formatPrice(total)}`
                )}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure, encrypted checkout
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
