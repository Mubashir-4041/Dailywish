import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { getAdminStats } from '@/app/admin/_lib/stats';
import { StatCard } from '@/components/admin/stat-card';
import { RevenueChart, OrdersByStatusChart } from '@/components/admin/charts';
import { PageHeader, DbNotice, StatusBadge, EmptyState } from '@/components/admin/admin-ui';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A real-time snapshot of your store performance."
      />

      {!stats.live ? <DbNotice /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={stats.totals.revenue}
          icon="revenue"
          format="currency"
          accent="emerald"
          hint="Paid orders"
        />
        <StatCard
          label="Orders"
          value={stats.totals.orders}
          icon="orders"
          accent="primary"
        />
        <StatCard
          label="Customers"
          value={stats.totals.customers}
          icon="customers"
          accent="violet"
        />
        <StatCard
          label="Products"
          value={stats.totals.products}
          icon="products"
          accent="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue (last 6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.revenueSeries} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.ordersByStatus.length ? (
              <OrdersByStatusChart data={stats.ordersByStatus} />
            ) : (
              <EmptyState title="No orders yet" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent orders</CardTitle>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {stats.recentOrders.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((o) => (
                    <TableRow key={o.orderNumber}>
                      <TableCell className="pl-6">
                        <Link
                          href={`/admin/orders/${o.orderNumber}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">{o.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium tabular-nums">
                        {formatPrice(o.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="px-6">
                <EmptyState
                  title="No recent orders"
                  description={stats.live ? 'Orders will appear here.' : 'Connect a database to see live orders.'}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low stock
            </CardTitle>
            <Link
              href="/admin/products"
              className="text-sm font-medium text-primary hover:underline"
            >
              Manage
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.lowStock.length ? (
              stats.lowStock.map((p) => (
                <div key={p._id} className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.stock === 0
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {p.stock} left
                  </span>
                </div>
              ))
            ) : (
              <EmptyState title="Everything well stocked" />
            )}
          </CardContent>
        </Card>
      </div>

      {stats.topProducts.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Top selling products</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.topProducts.map((p, i) => (
              <div key={p._id} className="rounded-lg border p-3">
                <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-muted">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover" sizes="160px" />
                  ) : null}
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    #{i + 1}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.sold.toLocaleString()} sold · {formatPrice(p.price)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
