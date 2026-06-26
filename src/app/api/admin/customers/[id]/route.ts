import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { handler, parseBody, ok, fail, takeOne } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import { logAdminAction } from '@/server/audit';

export const runtime = 'nodejs';

type Ctx = { params?: Promise<Record<string, string>> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const updateCustomerSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'customer']).optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await requireRole();
  const db = getDb();
  const params = ctx.params ? await ctx.params : {};
  const id = params.id;
  if (!id) return fail(400, 'Missing customer id');
  if (!UUID_RE.test(id)) return fail(404, 'Customer not found');

  const parsed = await parseBody(req, updateCustomerSchema);
  if ('response' in parsed) return parsed.response;
  const { role, isActive } = parsed.data;

  // Role changes are restricted to super admins.
  if (role !== undefined && admin.role !== 'super_admin') {
    return fail(403, 'Only a super admin can change user roles');
  }

  const [doc] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!doc) return fail(404, 'Customer not found');

  // Prevent self-lockout / self-demotion.
  if (String(doc.id) === admin.id) {
    if (isActive === false) return fail(400, 'You cannot deactivate your own account');
    if (role !== undefined && role !== doc.role) {
      return fail(400, 'You cannot change your own role');
    }
  }

  const nextRole = role !== undefined ? role : doc.role;
  let nextIsActive = doc.isActive;
  let nextTokenVersion = doc.tokenVersion ?? 0;
  if (isActive !== undefined) {
    nextIsActive = isActive;
    // Invalidate sessions when deactivating.
    if (!isActive) nextTokenVersion = (doc.tokenVersion ?? 0) + 1;
  }

  const updated = takeOne(await db
    .update(users)
    .set({
      role: nextRole,
      isActive: nextIsActive,
      tokenVersion: nextTokenVersion,
      updatedAt: new Date(),
    })
    .where(eq(users.id, doc.id))
    .returning());

  await logAdminAction(admin, 'customer.update', 'User', String(updated.id), {
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive,
  });

  return ok({
    _id: String(updated.id),
    role: updated.role,
    isActive: updated.isActive,
  });
});
