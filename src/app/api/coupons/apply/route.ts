import type { NextRequest } from 'next/server';
import { handler, parseBody, ok, fail } from '@/lib/api';
import { couponApplySchema } from '@/lib/validations';
import { validateCoupon } from '@/server/commerce';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const parsed = await parseBody(req, couponApplySchema);
  if ('response' in parsed) return parsed.response;
  const { code, subtotal } = parsed.data;

  const result = await validateCoupon(code, subtotal);
  if (!result.ok) return fail(400, result.message);
  return ok(result);
});
