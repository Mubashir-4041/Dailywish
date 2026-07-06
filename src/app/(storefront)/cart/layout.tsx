import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Your Cart',
  description: 'Review the items in your DailyWish shopping cart before checkout.',
  path: '/cart',
  index: false,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
