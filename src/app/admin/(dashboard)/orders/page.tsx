'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, DbNotice, EmptyState, StatusBadge, PaymentBadge, HelpNote } from '@/components/admin/admin-ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice, formatDate } from '@/lib/utils';

interface OrderRow {
  _id: string;
  orderNumber: string;
  email: string;
  total: number;
  itemCount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'all') params.set('status', status);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.status === 503) {
        setNoDb(true);
        setRows([]);
        return;
      }
      const data = (await res.json()) as { data: OrderRow[]; totalPages: number };
      setNoDb(false);
      setRows(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Orders" description="Track and fulfill customer orders." />

      {noDb ? <DbNotice /> : null}

      <HelpNote className="mb-4">
        <span className="font-medium">Getting an Easypaisa or JazzCash order?</span> Open the order,
        check the payment screenshot the customer uploaded matches the total, then press{' '}
        <span className="font-medium">Verify payment</span>. That confirms the order and reserves the
        stock. If money never arrived, press <span className="font-medium">Reject</span>. Change the
        wallet numbers anytime under <Link href="/admin/settings">Settings</Link>.
      </HelpNote>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search order # or email…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title={noDb ? 'No live data' : 'No orders found'} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="pl-6">
                    <Link
                      href={`/admin/orders/${o.orderNumber}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">{o.itemCount} item(s)</p>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{o.email}</TableCell>
                  <TableCell>
                    <PaymentBadge status={o.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatPrice(o.total)}
                  </TableCell>
                  <TableCell className="pr-6 text-sm text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
