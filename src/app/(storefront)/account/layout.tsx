import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, isAdminRole } from '@/lib/auth';
import { AccountNav } from '@/components/account/account-nav';

// The whole customer account area is private (login-gated + disallowed in
// robots.txt) — keep it out of the index. Applies to every /account/* page.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/account');
  // Admins/super-admins manage the store from the admin panel and have no
  // customer-facing account. Never show them the customer dashboard — no matter
  // how they got here (direct nav, a stale ?redirect=/account after login, or a
  // header link). The admin area owns their profile/security settings.
  if (isAdminRole(user.role)) redirect('/admin');

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          Hello, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your orders, addresses and account details.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-4">
            <div className="mb-4 flex items-center gap-3 border-b pb-4">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <AccountNav />
          </Card>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
