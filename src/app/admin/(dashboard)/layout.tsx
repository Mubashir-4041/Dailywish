import { redirect } from 'next/navigation';
import { requireRole, AuthError } from '@/lib/auth';
import { AdminSidebarNav } from '@/components/admin/admin-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let admin;
  try {
    admin = await requireRole();
  } catch (err) {
    if (err instanceof AuthError) redirect('/admin/login');
    throw err;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background lg:block">
        <AdminSidebarNav />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <AdminTopbar name={admin.name} email={admin.email} role={admin.role} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
