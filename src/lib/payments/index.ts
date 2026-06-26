import 'server-only';
import type { PaymentMethod } from '@/types';

export interface PaymentIntentInput {
  orderNumber: string;
  amount: number; // in PKR (major units)
  currency: string;
  email: string;
  description: string;
}

export interface PaymentResult {
  provider: PaymentMethod;
  status: 'pending' | 'requires_action' | 'paid' | 'failed';
  /** URL to redirect the customer to (hosted checkout), if any. */
  redirectUrl?: string;
  /** Client secret for embedded/elements flows, if any. */
  clientSecret?: string;
  reference?: string;
}

export interface PaymentProvider {
  readonly method: PaymentMethod;
  createPayment(input: PaymentIntentInput): Promise<PaymentResult>;
}

/** Cash on Delivery - no online charge; order is paid on delivery. */
class CodProvider implements PaymentProvider {
  readonly method = 'cod' as const;
  async createPayment(): Promise<PaymentResult> {
    return { provider: 'cod', status: 'pending' };
  }
}

/** Stripe - creates a PaymentIntent (test/live keys via env). */
class StripeProvider implements PaymentProvider {
  readonly method = 'stripe' as const;
  async createPayment(input: PaymentIntentInput): Promise<PaymentResult> {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured (missing STRIPE_SECRET_KEY).');
    }
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100), // PKR paisa
      currency: input.currency.toLowerCase(),
      description: input.description,
      receipt_email: input.email,
      metadata: { orderNumber: input.orderNumber },
      automatic_payment_methods: { enabled: true },
    });
    return {
      provider: 'stripe',
      status: 'requires_action',
      clientSecret: intent.client_secret ?? undefined,
      reference: intent.id,
    };
  }
}

/** PayPal - scaffolded; integrate the Orders API when credentials are added. */
class PayPalProvider implements PaymentProvider {
  readonly method = 'paypal' as const;
  async createPayment(input: PaymentIntentInput): Promise<PaymentResult> {
    // Implement PayPal Orders API here. Returns a pending result for now.
    return {
      provider: 'paypal',
      status: 'pending',
      reference: `pp_${input.orderNumber}`,
    };
  }
}

const providers: Record<PaymentMethod, PaymentProvider> = {
  cod: new CodProvider(),
  stripe: new StripeProvider(),
  paypal: new PayPalProvider(),
};

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return providers[method];
}
