import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { getCurrentUser } from '@/lib/auth';
import { getCategories } from '@/server/catalog';
import { getSiteSettings } from '@/server/settings';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, categories, settings] = await Promise.all([
    getCurrentUser(),
    getCategories(),
    getSiteSettings(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} categories={categories} settings={settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
      <CartDrawer />
    </div>
  );
}
