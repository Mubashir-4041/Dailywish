import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { siteConfig } from '@/config/site';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-amber-50 px-4 py-10">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{siteConfig.tagline}</p>
        </div>

        {children}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link
            href="/"
            className="font-medium underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
