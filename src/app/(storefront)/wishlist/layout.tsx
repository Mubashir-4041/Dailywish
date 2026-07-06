import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Your Wishlist',
  description: 'Products you have saved to your DailyWish wishlist.',
  path: '/wishlist',
  index: false,
});

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
