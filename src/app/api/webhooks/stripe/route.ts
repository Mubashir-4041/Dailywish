import type { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { markOrderPaid, markOrderPaymentFailed } from '@/server/payments';

export const runtime = 'nodejs';
// Stripe needs the raw, unparsed body to verify the signature — make sure this
// route is never statically optimized or body-parsed.
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook — the authoritative source of truth for payment status.
 * Configure in the Stripe dashboard (or `stripe listen --forward-to
 * localhost:3000/api/webhooks/stripe`) and set STRIPE_WEBHOOK_SECRET.
 *
 * NOTE: this handler intentionally bypasses `handler()`/`parseBody()` because
 * those consume/transform the body; signature verification requires the raw
 * bytes exactly as Stripe sent them.
 */
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return new Response('Stripe not configured', { status: 503 });
  }

  const body = await req.text(); // raw body
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  const StripeCtor = (await import('stripe')).default;
  const stripe = new StripeCtor(process.env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  if (secret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[stripe-webhook] signature verification failed:', (err as Error).message);
      return new Response('Invalid signature', { status: 400 });
    }
  } else {
    // No secret configured — accept unverified events ONLY outside production so
    // local development works without `stripe listen`. Never in prod.
    if (process.env.NODE_ENV === 'production') {
      return new Response('Webhook secret not configured', { status: 503 });
    }
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return new Response('Bad payload', { status: 400 });
    }
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderNumber = pi.metadata?.orderNumber;
        if (orderNumber) await markOrderPaid(orderNumber, pi.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderNumber = pi.metadata?.orderNumber;
        if (orderNumber) await markOrderPaymentFailed(orderNumber);
        break;
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[stripe-webhook] handler error:', (err as Error).message);
    // 500 → Stripe will retry, which is what we want for a transient DB blip.
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
