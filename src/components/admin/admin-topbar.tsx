'use client';

import { useState } from 'react';
import { Menu, LogOut, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AdminSidebarNav } from './admin-sidebar';

interface AdminTopbarProps {
  name: string;
  email: string;
  role: string;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  customer: 'Customer',
};

export function AdminTopbar({ name, email, role }: AdminTopbarProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Signed out');
      // Full reload so the cleared session is re-evaluated and the cached
      // dashboard shell is dropped rather than lingering in the Router Cache.
      window.location.assign('/admin/login');
    } catch {
      toast.error('Could not sign out');
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <AdminSidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold">Welcome back, {name.split(' ')[0]}</p>
          <p className="text-xs text-muted-foreground">Here is what is happening in your store.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-muted">
              <Avatar className="h-9 w-9 border">
                <AvatarFallback>{initials(name)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight md:block">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{roleLabel[role] ?? role}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="leading-tight">
                <p className="text-sm font-medium">{name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                View store
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              disabled={signingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
