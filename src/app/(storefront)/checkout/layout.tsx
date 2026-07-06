import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Checkout',
  description: 'Complete your DailyWish order securely.',
  path: '/checkout',
  index: false,
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
