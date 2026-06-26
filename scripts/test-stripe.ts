/**
 * Verify Stripe (test mode) credentials.
 *
 * Validates the secret key by retrieving the account balance (hard check),
 * then attempts a throwaway PaymentIntent (best-effort — currency support
 * depends on the account country, so a failure here is only a warning).
 *
 * Usage:  npm run test:stripe
 * Requires STRIPE_SECRET_KEY in .env.local
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import Stripe from 'stripe';

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('❌ Missing STRIPE_SECRET_KEY in .env.local');
    process.exit(1);
  }
  if (!key.startsWith('sk_test') && !key.startsWith('rk_test')) {
    console.warn('⚠️  STRIPE_SECRET_KEY is not a TEST key — proceed with caution.');
  }

  const stripe = new Stripe(key);

  console.log('→ Validating key via balance.retrieve…');
  const balance = await stripe.balance.retrieve();
  const avail =
    balance.available.map((b) => `${b.amount} ${b.currency}`).join(', ') || '0';
  console.log('✅ Key is valid. Available balance:', avail);

  console.log('→ Creating a throwaway PaymentIntent…');
  try {
    const intent = await stripe.paymentIntents.create({
      amount: 10000,
      currency: 'usd',
      description: 'DailyWish connectivity test',
      automatic_payment_methods: { enabled: true },
      metadata: { healthcheck: 'true' },
    });
    console.log('✅ PaymentIntent created:', intent.id, '·', intent.status);
    await stripe.paymentIntents.cancel(intent.id);
    console.log('✅ Canceled the test intent.');
  } catch (e) {
    console.warn(
      '⚠️  PaymentIntent step skipped (key is still valid):',
      e instanceof Error ? e.message : e,
    );
  }

  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  console.log(
    pk?.startsWith('pk_')
      ? '✅ Publishable key present.'
      : '⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing.',
  );
  console.log('🎉 Stripe is working.');
}

main().catch((e) => {
  console.error('❌ Stripe test failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
