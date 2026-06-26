'use client';
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  LogOut,
  LayoutDashboard,
  Package,
  X,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { mainNav } from '@/config/site';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/providers/cart-provider';
import { useWishlist } from '@/components/providers/wishlist-provider';
import type { SessionUser } from '@/lib/auth';
import type { SiteSettings } from '@/server/settings';
import type { Category } from '@/types';

export function SiteHeader({
  user,
  categories,
  settings,
}: {
  user: SessionUser | null;
  categories: Category[];
  settings: SiteSettings;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();
  const wishlist = useWishlist();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/shop?search=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Hard navigation: clears Next's client Router Cache so guarded/account
    // pages (e.g. /admin) re-run their server checks instead of serving a
    // stale, already-rendered payload.
    window.location.assign('/');
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-all',
        scrolled
          ? 'border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75'
          : 'border-transparent bg-background',
      )}
    >
      {/* Announcement strip */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex h-9 items-center justify-center gap-2 text-center text-xs font-medium sm:text-sm">
          <span className="hidden sm:inline">✨</span>
          {settings.announcement ? (
            settings.announcement
          ) : (
            <>
              Free delivery on orders over{' '}
              {formatPrice(settings.freeShippingThreshold)} · Cash on Delivery
              available across Pakistan
            </>
          )}
        </div>
      </div>

      <div className="container flex h-16 items-center gap-4">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-xs">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 font-display text-2xl">
                <Image
                  src="/logo-mark.png"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                />
                DailyWish
              </SheetTitle>
            </SheetHeader>
            <form onSubmit={submitSearch} className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products…"
                  className="pl-9"
                />
              </div>
            </form>
            <nav className="mt-6 flex flex-col gap-1">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-muted"
                >
                  {item.title}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              <p className="px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
                Categories
              </p>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?category=${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/logo-mark.png"
            alt="DailyWish"
            width={40}
            height={40}
            priority
            className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
          />
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            Daily<span className="text-accent">Wish</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
                  active ? 'text-primary' : 'text-foreground/80',
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Desktop search */}
        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for face wash, serum…"
              className="pl-9"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search"
            onClick={() => setSearchOpen((o) => !o)}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <Link href="/wishlist" aria-label="Wishlist">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
              {wishlist.count > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                  {wishlist.count}
                </Badge>
              )}
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Cart"
            onClick={() => cart.setOpen(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.count > 0 && (
              <Badge
                variant="accent"
                className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
              >
                {cart.count}
              </Badge>
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{user.name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  // Admins manage the store from the admin panel; the customer
                  // account section redirects them here anyway.
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/account">
                        <User className="h-4 w-4" /> My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders">
                        <Package className="h-4 w-4" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild aria-label="Sign in">
              <Link href="/login">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile inline search */}
      {searchOpen && (
        <div className="border-t md:hidden">
          <form onSubmit={submitSearch} className="container py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="pl-9"
              />
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
