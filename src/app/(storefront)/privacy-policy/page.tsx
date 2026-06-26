import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How DailyWish by Majid Cosmetics collects, uses and protects your personal information when you shop with us.',
  alternates: { canonical: '/privacy-policy' },
};

const LAST_UPDATED = '21 June 2026';

const sections = [
  { id: 'information-we-collect', title: '1. Information We Collect' },
  { id: 'how-we-use', title: '2. How We Use Your Information' },
  { id: 'cookies', title: '3. Cookies & Tracking' },
  { id: 'sharing', title: '4. How We Share Information' },
  { id: 'data-security', title: '5. Data Security' },
  { id: 'your-rights', title: '6. Your Rights & Choices' },
  { id: 'retention', title: '7. Data Retention' },
  { id: 'children', title: "8. Children's Privacy" },
  { id: 'changes', title: '9. Changes to This Policy' },
  { id: 'contact', title: '10. Contact Us' },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b pb-8">
          <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-3 text-muted-foreground">
            Last updated: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
          </p>
          <p className="mt-4 text-muted-foreground">
            At {siteConfig.legalName} (&ldquo;{siteConfig.name}&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;), your privacy matters. This policy explains what information
            we collect when you visit our website or shop with us, and how we use and
            protect it.
          </p>
        </header>

        {/* Table of contents */}
        <nav className="mb-10 rounded-xl border bg-muted/40 p-6" aria-label="Table of contents">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            On this page
          </h2>
          <ol className="mt-3 space-y-1.5 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          <Section id="information-we-collect" title="1. Information We Collect">
            <p>We collect information that helps us fulfil your orders and improve your experience:</p>
            <ul>
              <li>
                <strong>Account &amp; contact details</strong> - your name, email address,
                phone number and password when you register.
              </li>
              <li>
                <strong>Order &amp; delivery information</strong> - shipping addresses,
                items purchased and order history.
              </li>
              <li>
                <strong>Payment information</strong> - for Cash on Delivery we store no
                card data; online payments are handled by secure third-party processors.
              </li>
              <li>
                <strong>Usage data</strong> - pages visited, device and browser
                information, collected through cookies and similar technologies.
              </li>
            </ul>
          </Section>

          <Section id="how-we-use" title="2. How We Use Your Information">
            <ul>
              <li>To process, fulfil and deliver your orders.</li>
              <li>To provide customer support and respond to your enquiries.</li>
              <li>To send order updates and, where you opt in, marketing communications.</li>
              <li>To prevent fraud and keep our store and your account secure.</li>
              <li>To improve our products, website and overall service.</li>
            </ul>
          </Section>

          <Section id="cookies" title="3. Cookies & Tracking">
            <p>
              We use cookies to keep you signed in, remember your cart and understand how
              our store is used. You can control cookies through your browser settings,
              though some features may not work without them.
            </p>
          </Section>

          <Section id="sharing" title="4. How We Share Information">
            <p>We never sell your personal data. We share information only with:</p>
            <ul>
              <li>Courier and logistics partners to deliver your orders.</li>
              <li>Payment processors to complete online transactions securely.</li>
              <li>Service providers who help us operate our website and communications.</li>
              <li>Authorities where required by Pakistani law.</li>
            </ul>
          </Section>

          <Section id="data-security" title="5. Data Security">
            <p>
              We apply reasonable technical and organisational safeguards to protect your
              data. Passwords are stored in hashed form, and access is limited to
              authorised staff. No online system is completely secure, so we encourage you
              to use a strong, unique password.
            </p>
          </Section>

          <Section id="your-rights" title="6. Your Rights & Choices">
            <p>You may, at any time:</p>
            <ul>
              <li>Access and update your account details from your dashboard.</li>
              <li>Request a copy or deletion of your personal data.</li>
              <li>Unsubscribe from marketing emails using the link in any message.</li>
            </ul>
            <p>
              To exercise these rights, contact us using the details below.
            </p>
          </Section>

          <Section id="retention" title="7. Data Retention">
            <p>
              We keep your information for as long as your account is active or as needed
              to provide our services, comply with legal obligations, resolve disputes and
              enforce our agreements.
            </p>
          </Section>

          <Section id="children" title="8. Children's Privacy">
            <p>
              Our store is intended for customers aged 18 and over. We do not knowingly
              collect personal information from children. If you believe a child has
              provided us data, please contact us so we can remove it.
            </p>
          </Section>

          <Section id="changes" title="9. Changes to This Policy">
            <p>
              We may update this policy from time to time. Any changes will be posted on
              this page with a revised &ldquo;last updated&rdquo; date.
            </p>
          </Section>

          <Section id="contact" title="10. Contact Us">
            <p>If you have questions about this Privacy Policy, please reach out:</p>
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
