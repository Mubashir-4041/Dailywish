'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Package, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface OrderRow {
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data: { orders?: OrderRow[] }) => {
        if (active) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (active) setOrders([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {orders === null ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">No orders yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              You haven&apos;t placed any orders. Explore our skincare range and find your
              glow.
            </p>
            <Button asChild className="mt-5">
              <Link href="/shop">Browse products</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {orders.map((order) => (
              <li
                key={order._id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{order.orderNumber}</span>
                      <Badge
                        variant={statusVariant[order.status]}
                        className="capitalize"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} ·{' '}
                      {order.items.reduce((n, it) => n + it.quantity, 0)} item(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/account/orders/${order.orderNumber}`}>
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
