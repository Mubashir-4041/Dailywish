import type { Metadata } from 'next';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ContactForm } from '@/components/storefront/contact-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with DailyWish by Majid Cosmetics. Reach us by email, phone or WhatsApp, send us a message, or visit our stores in Swabi and Mardan.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsapp}`;

  return (
    <div className="pb-16">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-14 text-center">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Get in touch</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Questions about a product, your order or anything else? We&apos;d love to
            hear from you.
          </p>
        </div>
      </section>

      <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1fr_1.2fr]">
        {/* Contact details */}
        <div className="space-y-4">
          <ContactDetail
            icon={<Mail className="h-5 w-5" />}
            title="Email"
            value={siteConfig.email}
            href={`mailto:${siteConfig.email}`}
          />
          <ContactDetail
            icon={<Phone className="h-5 w-5" />}
            title="Phone"
            value={siteConfig.phone}
            href={`tel:${siteConfig.phoneIntl}`}
          />
          <Card>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  Chat with us for quick help
                </p>
                <Button asChild size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    Message on WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Store hours</p>
                <p className="text-sm text-muted-foreground">
                  Monday – Saturday: 10:00 AM – 9:00 PM
                </p>
                <p className="text-sm text-muted-foreground">Friday: 2:00 PM – 9:00 PM</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>

      {/* Locations */}
      <section id="locations" className="container mx-auto scroll-mt-24 px-4 py-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold">Our stores</h2>
          <p className="mt-3 text-muted-foreground">
            Visit us in person at either of our locations in Khyber Pakhtunkhwa.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {siteConfig.locations.map((loc) => (
            <Card key={loc.id} className="overflow-hidden">
              <div className="aspect-video w-full bg-muted">
                <iframe
                  title={`Map of ${loc.name}`}
                  src={`https://www.google.com/maps?q=${loc.mapsQuery}&output=embed`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">{loc.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{loc.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {loc.city}, {loc.region}, {loc.country}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Google Maps
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function ContactDetail({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <a
            href={href}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            {value}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
