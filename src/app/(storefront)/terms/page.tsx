import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms and conditions governing your use of the DailyWish by Majid Cosmetics website and your purchases.',
  alternates: { canonical: '/terms' },
};

const LAST_UPDATED = '21 June 2026';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'eligibility', title: '2. Eligibility' },
  { id: 'accounts', title: '3. Your Account' },
  { id: 'products-pricing', title: '4. Products & Pricing' },
  { id: 'orders', title: '5. Orders & Acceptance' },
  { id: 'payment', title: '6. Payment' },
  { id: 'shipping', title: '7. Shipping & Delivery' },
  { id: 'returns', title: '8. Returns & Refunds' },
  { id: 'conduct', title: '9. Acceptable Use' },
  { id: 'ip', title: '10. Intellectual Property' },
  { id: 'liability', title: '11. Limitation of Liability' },
  { id: 'law', title: '12. Governing Law' },
  { id: 'changes', title: '13. Changes to These Terms' },
  { id: 'contact', title: '14. Contact Us' },
];

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b pb-8">
          <h1 className="font-display text-4xl font-bold">Terms &amp; Conditions</h1>
          <p className="mt-3 text-muted-foreground">
            Last updated: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
          </p>
          <p className="mt-4 text-muted-foreground">
            These Terms &amp; Conditions govern your access to and use of the{' '}
            {siteConfig.legalName} website and the purchase of products from{' '}
            {siteConfig.name}. By using our store, you agree to these terms.
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
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              By accessing or placing an order on our website, you confirm that you have
              read, understood and agreed to be bound by these terms. If you do not agree,
              please do not use our store.
            </p>
          </Section>

          <Section id="eligibility" title="2. Eligibility">
            <p>
              You must be at least 18 years of age, or have the consent of a parent or
              guardian, to make a purchase. You confirm that all information you provide is
              accurate and complete.
            </p>
          </Section>

          <Section id="accounts" title="3. Your Account">
            <p>
              You are responsible for keeping your account credentials confidential and for
              all activity under your account. Notify us immediately of any unauthorised
              use. We may suspend accounts that violate these terms.
            </p>
          </Section>

          <Section id="products-pricing" title="4. Products & Pricing">
            <ul>
              <li>All prices are listed in Pakistani Rupees (PKR) and include applicable taxes unless stated otherwise.</li>
              <li>We strive to display products and colours accurately, but actual appearance may vary slightly.</li>
              <li>We reserve the right to correct pricing errors and update product availability at any time.</li>
            </ul>
          </Section>

          <Section id="orders" title="5. Orders & Acceptance">
            <p>
              Your order is an offer to buy. We may accept or decline any order, for
              example where an item is out of stock, a pricing error has occurred or we are
              unable to verify your details. If we cancel an order you have paid for, we
              will issue a full refund.
            </p>
          </Section>

          <Section id="payment" title="6. Payment">
            <p>
              We accept Cash on Delivery (COD) and supported online payment methods. For
              COD orders, payment is due in full to the courier on delivery. Online
              payments are processed securely by third-party providers.
            </p>
          </Section>

          <Section id="shipping" title="7. Shipping & Delivery">
            <p>
              We deliver across Pakistan. Orders over{' '}
              {siteConfig.shipping.freeThreshold.toLocaleString('en-PK')} PKR qualify for
              free shipping; otherwise a flat rate of{' '}
              {siteConfig.shipping.flatRate.toLocaleString('en-PK')} PKR applies. Delivery
              timelines are estimates and may vary by location and courier.
            </p>
          </Section>

          <Section id="returns" title="8. Returns & Refunds">
            <p>
              Returns and refunds are handled in accordance with our{' '}
              <Link href="/return-policy" className="text-primary hover:underline">
                Return Policy
              </Link>
              . Please review it before requesting a return.
            </p>
          </Section>

          <Section id="conduct" title="9. Acceptable Use">
            <p>You agree not to:</p>
            <ul>
              <li>Use the website for any unlawful or fraudulent purpose.</li>
              <li>Interfere with the security or proper functioning of the store.</li>
              <li>Reproduce or resell our content without permission.</li>
            </ul>
          </Section>

          <Section id="ip" title="10. Intellectual Property">
            <p>
              All content on this website - including logos, text, images and product
              descriptions - is the property of {siteConfig.legalName} and is protected by
              applicable laws. You may not use it without our written permission.
            </p>
          </Section>

          <Section id="liability" title="11. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, {siteConfig.name} shall not be liable
              for any indirect or consequential loss arising from your use of our products
              or website. Our total liability for any claim shall not exceed the amount you
              paid for the relevant order. Always patch-test new skincare products and
              discontinue use if irritation occurs.
            </p>
          </Section>

          <Section id="law" title="12. Governing Law">
            <p>
              These terms are governed by the laws of the Islamic Republic of Pakistan, and
              any disputes shall be subject to the exclusive jurisdiction of the courts of
              Khyber Pakhtunkhwa.
            </p>
          </Section>

          <Section id="changes" title="13. Changes to These Terms">
            <p>
              We may update these terms from time to time. Continued use of the store after
              changes are posted constitutes acceptance of the revised terms.
            </p>
          </Section>

          <Section id="contact" title="14. Contact Us">
            <p>Questions about these terms? Get in touch:</p>
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
      <div className="mt-3 space-y-3 text-muted-foreground [&_a]:font-medium [&_li]:ml-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
