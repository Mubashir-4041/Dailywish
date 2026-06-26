'use client';
import * as React from 'react';
import { ThemeProvider } from './theme-provider';
import { CartProvider } from './cart-provider';
import { WishlistProvider } from './wishlist-provider';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <CartProvider>
        <WishlistProvider>
          {children}
          <Toaster />
        </WishlistProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
