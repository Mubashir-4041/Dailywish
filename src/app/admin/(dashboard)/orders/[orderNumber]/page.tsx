'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Loader2, MapPin, Receipt, Clock, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, StatusBadge, PaymentBadge, EmptyState } from '@/components/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { formatPrice, formatDate } from '@/lib/utils';

interface OrderItem {
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  variant?: { name: string; value: string; sku: string } | null;
}

interface OrderDetail {
  orderNumber: string;
  email: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode?: string;
    country: string;
  };
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  statusHistory: { status: string; at: string; note?: string }[];
  createdAt: string;
}

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`);
      if (res.status === 503) {
        setNoDb(true);
        return;
      }
      if (!res.ok) {
        setOrder(null);
        return;
      }
      const data = (await res.json()) as OrderDetail;
      setOrder(data);
      setStatus(data.status);
      setPaymentStatus(data.paymentStatus);
    } catch {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus, note: note || undefined }),
      });
      const data = (await res.json()) as OrderDetail & { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not update');
        return;
      }
      toast.success('Order updated');
      setNote('');
      setOrder(data);
      setStatus(data.status);
      setPaymentStatus(data.paymentStatus);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrder() {
    if (
      !window.confirm(
        'Cancel this order? Stock will be restored and any card payment refunded.',
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', note: note || 'Cancelled by admin' }),
      });
      const data = (await res.json()) as OrderDetail & { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not cancel');
        return;
      }
      toast.success('Order cancelled');
      setNote('');
      setOrder(data);
      setStatus(data.status);
      setPaymentStatus(data.paymentStatus);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (noDb || !order) {
    return (
      <div>
        <Link
          href="/admin/orders"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to orders
        </Link>
        <EmptyState
          title={noDb ? 'Connect a database for live data' : 'Order not found'}
          description={noDb ? 'Order details require DATABASE_URL.' : undefined}
        />
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to orders
      </Link>
      <PageHeader
        title={order.orderNumber}
        description={`Placed on ${formatDate(order.createdAt)} · ${order.email}`}
        action={
          <div className="flex gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variant ? `${item.variant.name}: ${item.variant.value} · ` : ''}
                      Qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
              <Separator />
              <div className="space-y-1.5 text-sm">
                <Row label="Subtotal" value={formatPrice(order.subtotal)} />
                <Row label="Shipping" value={formatPrice(order.shipping)} />
                {order.discount > 0 ? (
                  <Row
                    label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}
                    value={`- ${formatPrice(order.discount)}`}
                  />
                ) : null}
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Status history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.statusHistory.length ? (
                <ol className="space-y-3">
                  {order.statusHistory
                    .slice()
                    .reverse()
                    .map((h, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm font-medium capitalize">{h.status}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(h.at)}</p>
                          {h.note ? <p className="text-sm">{h.note}</p> : null}
                        </div>
                      </li>
                    ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Order status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Internal note added to history"
                />
              </div>
              <Button className="w-full" onClick={updateStatus} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save update
              </Button>
              {order.status !== 'cancelled' &&
              order.status !== 'refunded' &&
              order.status !== 'delivered' ? (
                <Button
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={cancelOrder}
                  disabled={saving}
                >
                  <Ban className="h-4 w-4" /> Cancel order
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{addr.fullName}</p>
              <p>{addr.phone}</p>
              <p className="text-muted-foreground">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ''}
              </p>
              <p className="text-muted-foreground">
                {addr.city}, {addr.region} {addr.postalCode ?? ''}
              </p>
              <p className="text-muted-foreground">{addr.country}</p>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                Payment method: <span className="font-medium uppercase">{order.paymentMethod}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
