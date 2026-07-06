import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Create Account',
  description:
    'Create a DailyWish account to shop premium Vitamin C skincare, save your wishlist and track every order.',
  path: '/register',
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
