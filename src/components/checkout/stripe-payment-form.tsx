'use client';

import * as React from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { Loader2, ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { getStripe } from '@/lib/stripe-client';

interface Props {
  clientSecret: string;
  orderNumber: string;
  amount: number;
  onBack: () => void;
}

/** Inner form — must live inside <Elements> to use the Stripe hooks. */
function PaymentInner({ orderNumber, amount, onBack }: Omit<Props, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Stripe redirects here after any required authentication (3DS). The
        // success page re-verifies the PaymentIntent server-side before
        // showing "paid", so this URL can't be spoofed into a false success.
        return_url: `${window.location.origin}/checkout/success?order=${encodeURIComponent(orderNumber)}`,
      },
    });

    // We only reach here if there was an immediate error (e.g. invalid card);
    // on success Stripe performs a full-page redirect to return_url.
    if (error) {
      toast.error(error.message ?? 'Payment could not be completed.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={pay} className="space-y-5">
      <PaymentElement onReady={() => setReady(true)} />
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || submitting || !ready}>
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          `Pay ${formatPrice(amount)}`
        )}
      </Button>
      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to checkout
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Payments are processed securely by Stripe.
      </p>
    </form>
  );
}

export function StripePaymentForm({ clientSecret, orderNumber, amount, onBack }: Props) {
  // Resolve the Stripe.js instance up front so we can show a clear error if it
  // fails to load (blocked by CSP, offline, ad-blocker) instead of an <Elements>
  // that spins forever.
  const [stripe, setStripe] = React.useState<Stripe | null | undefined>(undefined);
  React.useEffect(() => {
    let active = true;
    getStripe().then((s) => active && setStripe(s));
    return () => {
      active = false;
    };
  }, []);

  if (stripe === undefined) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (stripe === null) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load the secure card form. Check your connection or any ad-blocker,
          then try again. Your order <span className="font-mono">{orderNumber}</span> is saved.
        </p>
        <Button variant="outline" className="w-full" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to checkout
        </Button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: { theme: 'stripe', variables: { colorPrimary: '#b56e1f' } },
      }}
    >
      <PaymentInner orderNumber={orderNumber} amount={amount} onBack={onBack} />
    </Elements>
  );
}
