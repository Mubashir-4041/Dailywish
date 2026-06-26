import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, MapPin, Package, ShoppingBag } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecentOrders } from '@/components/account/recent-orders';

export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false, follow: false },
};

const quickLinks = [
  {
    href: '/account/orders',
    label: 'My Orders',
    description: 'Track and review purchases',
    icon: Package,
  },
  {
    href: '/wishlist',
    label: 'Wishlist',
    description: 'Saved for later',
    icon: Heart,
  },
  {
    href: '/account/addresses',
    label: 'Addresses',
    description: 'Manage delivery details',
    icon: MapPin,
  },
];

export default async function AccountDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">
              Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s a snapshot of your DailyWish account.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/shop">
              <ShoppingBag className="h-4 w-4" />
              Continue shopping
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent orders</CardTitle>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link href="/account/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <RecentOrders limit={3} />
        </CardContent>
      </Card>
    </div>
  );
}
