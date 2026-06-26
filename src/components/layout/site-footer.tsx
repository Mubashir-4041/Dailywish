import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { siteConfig, footerNav } from '@/config/site';
import { NewsletterForm } from '@/components/storefront/newsletter-form';
import { Separator } from '@/components/ui/separator';
import type { SiteSettings } from '@/server/settings';

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t bg-muted/30">
      {/* Newsletter */}
      <div className="border-b bg-primary/5">
        <div className="container flex flex-col items-center gap-4 py-10 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="font-display text-2xl font-bold">Join the DailyWish glow club</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get skincare tips & exclusive offers straight to your inbox.
            </p>
          </div>
          <div className="w-full max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        {/* Brand + contact */}
        <div className="lg:col-span-2">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-2xl font-bold text-primary"
          >
            <Image
              src="/logo-mark.png"
              alt="DailyWish"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
            />
            Daily<span className="text-accent">Wish</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            {siteConfig.legalName}. Premium skincare & cosmetics for fair, healthy &
            glowing skin - trusted across Pakistan.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Mail className="h-4 w-4" /> {siteConfig.email}
            </a>
            <a
              href={`tel:${siteConfig.phoneIntl}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Phone className="h-4 w-4" /> {siteConfig.phone}
            </a>
          </div>
          <div className="mt-4 flex gap-3">
            <a href={settings.social.facebook} aria-label="Facebook" className="rounded-full border p-2 hover:bg-primary hover:text-primary-foreground">
              <Facebook className="h-4 w-4" />
            </a>
            <a href={settings.social.instagram} aria-label="Instagram" className="rounded-full border p-2 hover:bg-primary hover:text-primary-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={settings.social.youtube} aria-label="YouTube" className="rounded-full border p-2 hover:bg-primary hover:text-primary-foreground">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Link columns */}
        <FooterColumn title="Shop" links={footerNav.shop} />
        <FooterColumn title="Account" links={footerNav.account} />
        <FooterColumn title="Company" links={[...footerNav.company, ...footerNav.legal]} />
      </div>

      {/* Store locations */}
      <div id="locations" className="border-t">
        <div className="container grid gap-6 py-8 sm:grid-cols-2">
          {siteConfig.locations.map((loc) => (
            <div key={loc.id} className="flex gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{loc.name}</p>
                <p className="text-sm text-muted-foreground">{loc.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${loc.mapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View on Google Maps →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />
      <div className="container flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {siteConfig.founded}–present {siteConfig.legalName}. All rights reserved.
        </p>
        <p className="flex items-center gap-3">
          <Link href="/privacy-policy" className="hover:text-primary">Privacy</Link>
          <Link href="/terms" className="hover:text-primary">Terms</Link>
          <Link href="/return-policy" className="hover:text-primary">Returns</Link>
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { title: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.title}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
