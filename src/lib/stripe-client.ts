import { loadStripe, type Stripe } from '@stripe/stripe-js';

/**
 * Lazily-loaded, memoized Stripe.js instance for the browser. Returns null when
 * the publishable key isn't configured so callers can degrade gracefully.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) {
    // Resolve to null on failure (e.g. blocked by CSP / offline) instead of
    // rejecting — a rejected promise here surfaces as an unhandled rejection
    // and leaves <Elements> stuck loading. Callers handle the null.
    stripePromise = loadStripe(key).catch(() => null);
  }
  return stripePromise;
}
