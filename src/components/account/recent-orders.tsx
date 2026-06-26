'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Package, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface OrderSummary {
  _id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const statusVariant: Record<
  OrderStatus,
  'default' | 'secondary' | 'accent' | 'destructive' | 'success' | 'outline'
> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  shipped: 'accent',
  delivered: 'success',
  cancelled: 'destructive',
  refunded: 'outline',
};

export function RecentOrders({ limit = 3 }: { limit?: number }) {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data: { orders?: OrderSummary[] }) => {
        if (active) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (active) setOrders([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (orders === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium">No orders yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When you place an order, it&apos;ll show up here.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.slice(0, limit).map((order) => (
        <li key={order._id}>
          <Link
            href={`/account/orders/${order.orderNumber}`}
            className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{order.orderNumber}</span>
                <Badge variant={statusVariant[order.status]} className="capitalize">
                  {order.status}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {formatDate(order.createdAt)} ·{' '}
                {order.items.reduce((n, it) => n + it.quantity, 0)} item(s)
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatPrice(order.total)}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
