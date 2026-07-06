import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Verify Email',
  description: 'Verify your email address to activate your DailyWish account.',
  path: '/verify-email',
  index: false,
});

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
