import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { handler, ok, fail } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { orders } from '@/db/schema';

export const runtime = 'nodejs';

export const GET = handler(
  async (req: NextRequest, ctx: { params?: Promise<Record<string, string>> }) => {
    const params = ctx.params ? await ctx.params : {};
    const orderNumber = params.orderNumber!;
    if (!process.env.DATABASE_URL) return fail(503, 'Order tracking requires a database connection.');

    const db = getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);
    if (!order) return fail(404, 'Order not found');

    // Authorize: owner, matching email (guest tracking), or admin.
    const user = await getCurrentUser();
    const email = req.nextUrl.searchParams.get('email');
    const isOwner = user && order.userId && String(order.userId) === user.id;
    const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
    const emailMatches = email && order.email === email.toLowerCase();
    if (!isOwner && !isAdmin && !emailMatches) {
      return fail(403, 'You are not authorized to view this order');
    }

    return ok({ order: { ...order, _id: String(order.id) } });
  },
);
