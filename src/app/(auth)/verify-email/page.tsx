'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MailQuestion } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return (
      <Card className="border-border/60 shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle className="font-display text-2xl">Email verified</CardTitle>
          <CardDescription>
            Thanks for confirming your email address. Your {siteConfig.name} account is
            all set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/account">Go to my account</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
          <MailQuestion className="h-6 w-6" />
        </div>
        <CardTitle className="font-display text-2xl">Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to your inbox. Open the email and click the
          link to confirm your address. If you can&apos;t find it, check your spam folder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Need help? Contact us at{' '}
          <a
            href={`mailto:${siteConfig.email}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {siteConfig.email}
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
