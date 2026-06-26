'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Star,
  Ticket,
  ImageIcon,
  MessageSquareQuote,
  Mail,
  Settings,
  ScrollText,
  Store,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ADMIN_NAV = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Products', href: '/admin/products', icon: Package },
  { title: 'Categories', href: '/admin/categories', icon: FolderTree },
  { title: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { title: 'Customers', href: '/admin/customers', icon: Users },
  { title: 'Messages', href: '/admin/messages', icon: Mail },
  { title: 'Reviews', href: '/admin/reviews', icon: Star },
  { title: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { title: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { title: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
  { title: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
] as const;

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-base font-bold tracking-tight">DailyWish</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Admin Panel
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {ADMIN_NAV.map((item) => {
          const active = ('exact' in item && item.exact)
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Store className="h-[18px] w-[18px] shrink-0" />
          View Store
        </Link>
      </div>
    </div>
  );
}
