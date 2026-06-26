import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description:
    'DailyWish return, exchange and refund policy - eligibility, timelines and how to request a return for your skincare order.',
  alternates: { canonical: '/return-policy' },
};

const LAST_UPDATED = '21 June 2026';

const sections = [
  { id: 'overview', title: '1. Overview' },
  { id: 'eligibility', title: '2. Return Eligibility' },
  { id: 'non-returnable', title: '3. Non-Returnable Items' },
  { id: 'damaged', title: '4. Damaged or Wrong Items' },
  { id: 'how-to-return', title: '5. How to Request a Return' },
  { id: 'refunds', title: '6. Refunds' },
  { id: 'exchanges', title: '7. Exchanges' },
  { id: 'shipping-costs', title: '8. Return Shipping Costs' },
  { id: 'contact', title: '9. Contact Us' },
];

export default function ReturnPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b pb-8">
          <h1 className="font-display text-4xl font-bold">Return &amp; Refund Policy</h1>
          <p className="mt-3 text-muted-foreground">
            Last updated: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
          </p>
          <p className="mt-4 text-muted-foreground">
            We want you to love your {siteConfig.name} products. If something isn&apos;t
            right, this policy explains how returns, exchanges and refunds work.
          </p>
        </header>

        <nav className="mb-10 rounded-xl border bg-muted/40 p-6" aria-label="Table of contents">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            On this page
          </h2>
          <ol className="mt-3 space-y-1.5 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary underline-offset-4 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          <Section id="overview" title="1. Overview">
            <p>
              You may request a return within <strong>7 days</strong> of receiving your
              order, subject to the conditions below. Because we sell skincare and
              cosmetics, hygiene and safety rules apply to which items can be returned.
            </p>
          </Section>

          <Section id="eligibility" title="2. Return Eligibility">
            <p>To be eligible for a return, an item must be:</p>
            <ul>
              <li>Unused, unopened and in its original, sealed packaging.</li>
              <li>In re-saleable condition with all labels and seals intact.</li>
              <li>Accompanied by proof of purchase (order number or receipt).</li>
              <li>Requested within 7 days of delivery.</li>
            </ul>
          </Section>

          <Section id="non-returnable" title="3. Non-Returnable Items">
            <p>For hygiene and safety reasons, we cannot accept returns of:</p>
            <ul>
              <li>Opened, used or unsealed skincare, cosmetics or personal-care products.</li>
              <li>Items marked as final sale or part of clearance bundles.</li>
              <li>Free gifts and promotional items.</li>
            </ul>
          </Section>

          <Section id="damaged" title="4. Damaged or Wrong Items">
            <p>
              If you receive a damaged, defective or incorrect item, please contact us
              within <strong>48 hours</strong> of delivery with photos. We will arrange a
              free replacement or full refund - this exception applies even to opened
              products where the fault is ours.
            </p>
          </Section>

          <Section id="how-to-return" title="5. How to Request a Return">
            <ol>
              <li>Email us at {siteConfig.email} or message us on WhatsApp with your order number.</li>
              <li>Tell us which item(s) you wish to return and the reason.</li>
              <li>Our team will confirm eligibility and share return instructions.</li>
              <li>Pack the item securely in its original packaging and ship it back or hand it in at one of our stores.</li>
            </ol>
          </Section>

          <Section id="refunds" title="6. Refunds">
            <p>
              Once we receive and inspect your return, we&apos;ll notify you of approval.
              Approved refunds are processed within <strong>5–7 business days</strong>:
            </p>
            <ul>
              <li>Online payments are refunded to the original payment method.</li>
              <li>Cash on Delivery orders are refunded via bank transfer or easypaisa/JazzCash.</li>
            </ul>
          </Section>

          <Section id="exchanges" title="7. Exchanges">
            <p>
              Prefer a different product or variant? Eligible items can be exchanged
              subject to availability. If there&apos;s a price difference, we&apos;ll
              collect or refund it accordingly.
            </p>
          </Section>

          <Section id="shipping-costs" title="8. Return Shipping Costs">
            <p>
              For change-of-mind returns, the customer covers return shipping. Where the
              return is due to our error - a damaged, defective or wrong item - we cover all
              shipping costs.
            </p>
          </Section>

          <Section id="contact" title="9. Contact Us">
            <p>Need help with a return? We&apos;re here for you:</p>
            <ul>
              <li>
                Email:{' '}
                <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">
                  {siteConfig.email}
                </a>
              </li>
              <li>
                Phone:{' '}
                <a href={`tel:${siteConfig.phoneIntl}`} className="text-primary hover:underline">
                  {siteConfig.phone}
                </a>
              </li>
              <li>
                WhatsApp:{' '}
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Message us
                </a>
              </li>
              <li>
                Or visit our{' '}
                <Link href="/contact" className="text-primary hover:underline">
                  contact page
                </Link>
                .
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-muted-foreground [&_a]:font-medium [&_li]:ml-1 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
