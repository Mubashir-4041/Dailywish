import 'server-only';
import { and, asc, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { orders, products as productsTable, users } from '@/db/schema';
import { placedOrderCondition } from '@/server/orders';
import { products as staticProducts } from '@/data/catalog';
import type { OrderStatus } from '@/types';

export interface RecentOrder {
  orderNumber: string;
  email: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  image: string;
}

export interface TopProduct {
  _id: string;
  name: string;
  sold: number;
  price: number;
  image: string;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface AdminStats {
  live: boolean;
  totals: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
  };
  ordersByStatus: { status: string; count: number }[];
  revenueSeries: RevenuePoint[];
  recentOrders: RecentOrder[];
  lowStock: LowStockProduct[];
  topProducts: TopProduct[];
}

const LOW_STOCK_THRESHOLD = 25;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function emptySeries(): RevenuePoint[] {
  const now = new Date();
  const series: RevenuePoint[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    series.push({ label: MONTHS[d.getMonth()] ?? '', revenue: 0, orders: 0 });
  }
  return series;
}

/** Derive plausible demo stats from the static catalog when there is no DB. */
function fallbackStats(): AdminStats {
  const products = staticProducts;
  const productCount = products.length;
  const top = [...products]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      sold: p.sold,
      price: p.price,
      image: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? '',
    }));

  const estRevenue = products.reduce((sum, p) => sum + p.sold * p.price, 0);
  const estOrders = Math.round(products.reduce((sum, p) => sum + p.sold, 0) / 2.4);

  const series = emptySeries();
  const base = Math.round(estRevenue / 9);
  const seriesWithData = series.map((pt, i) => ({
    ...pt,
    revenue: Math.round(base * (0.6 + i * 0.12)),
    orders: Math.round((estOrders / 9) * (0.6 + i * 0.12)),
  }));

  const lowStock = products
    .filter((p) => p.stock <= LOW_STOCK_THRESHOLD + 75)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      image: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? '',
    }));

  return {
    live: false,
    totals: {
      revenue: estRevenue,
      orders: estOrders,
      customers: Math.round(estOrders * 0.78),
      products: productCount,
    },
    ordersByStatus: [
      { status: 'delivered', count: Math.round(estOrders * 0.62) },
      { status: 'shipped', count: Math.round(estOrders * 0.14) },
      { status: 'processing', count: Math.round(estOrders * 0.1) },
      { status: 'pending', count: Math.round(estOrders * 0.08) },
      { status: 'cancelled', count: Math.round(estOrders * 0.06) },
    ],
    revenueSeries: seriesWithData,
    recentOrders: [],
    lowStock,
    topProducts: top,
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  if (!process.env.DATABASE_URL) return fallbackStats();

  try {
    const db = getDb();

    const since = new Date();
    since.setMonth(since.getMonth() - 5, 1);
    since.setHours(0, 0, 0, 0);

    const monthExpr = sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'YYYY-MM')`;

    const [
      revenueAgg,
      ordersCountRows,
      customersCountRows,
      productsCountRows,
      statusAgg,
      monthlyAgg,
      recentDocs,
      lowStockDocs,
      topDocs,
    ] = await Promise.all([
      db
        .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)::float8` })
        .from(orders)
        .where(eq(orders.paymentStatus, 'paid')),
      db.select({ value: count() }).from(orders).where(placedOrderCondition()),
      db.select({ value: count() }).from(users).where(eq(users.role, 'customer')),
      db.select({ value: count() }).from(productsTable),
      db
        .select({ status: orders.status, count: count() })
        .from(orders)
        .where(placedOrderCondition())
        .groupBy(orders.status),
      db
        .select({
          ym: monthExpr,
          revenue: sql<number>`coalesce(sum(${orders.total}), 0)::float8`,
          orders: count(),
        })
        .from(orders)
        .where(and(gte(orders.createdAt, since), placedOrderCondition()))
        .groupBy(monthExpr),
      db.select().from(orders).where(placedOrderCondition()).orderBy(desc(orders.createdAt)).limit(6),
      db
        .select()
        .from(productsTable)
        .where(lte(productsTable.stock, LOW_STOCK_THRESHOLD))
        .orderBy(asc(productsTable.stock))
        .limit(6),
      db.select().from(productsTable).orderBy(desc(productsTable.sold)).limit(5),
    ]);

    const monthlyMap = new Map(monthlyAgg.map((m) => [m.ym, m]));
    const now = new Date();
    const revenueSeries: RevenuePoint[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = monthlyMap.get(key);
      revenueSeries.push({
        label: MONTHS[d.getMonth()] ?? '',
        revenue: Number(found?.revenue ?? 0),
        orders: Number(found?.orders ?? 0),
      });
    }

    return {
      live: true,
      totals: {
        revenue: Number(revenueAgg[0]?.total ?? 0),
        orders: ordersCountRows[0]?.value ?? 0,
        customers: customersCountRows[0]?.value ?? 0,
        products: productsCountRows[0]?.value ?? 0,
      },
      ordersByStatus: statusAgg.map((s) => ({ status: s.status, count: s.count })),
      revenueSeries,
      recentOrders: recentDocs.map((d) => ({
        orderNumber: d.orderNumber,
        email: d.email,
        total: d.total,
        status: d.status,
        createdAt: new Date(d.createdAt ?? Date.now()).toISOString(),
      })),
      lowStock: lowStockDocs.map((d) => ({
        _id: String(d.id),
        name: d.name,
        sku: d.sku,
        stock: d.stock ?? 0,
        image: d.images?.[0]?.url ?? '',
      })),
      topProducts: topDocs.map((d) => ({
        _id: String(d.id),
        name: d.name,
        sold: d.sold ?? 0,
        price: d.price,
        image: d.images?.[0]?.url ?? '',
      })),
    };
  } catch {
    return fallbackStats();
  }
}
