import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin · DailyWish',
  robots: { index: false, follow: false },
};

/**
 * Top-level admin segment. Intentionally a pass-through so that the
 * standalone login page (`/admin/login`) renders WITHOUT the dashboard
 * shell, while everything in the `(dashboard)` group gets the guarded shell.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
