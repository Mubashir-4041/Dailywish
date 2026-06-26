import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-amber-50/40 p-6 text-center">
      <p className="font-display text-8xl font-bold text-primary/20">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get
        you back to glowing.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/"><Home className="h-4 w-4" /> Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/shop"><Search className="h-4 w-4" /> Browse Shop</Link>
        </Button>
      </div>
    </div>
  );
}
