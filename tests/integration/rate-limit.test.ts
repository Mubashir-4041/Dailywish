import { rateLimit } from '@/lib/rate-limit';
import { validateCoupon } from '@/server/commerce';

describe('rateLimit', () => {
  it('allows requests under the limit and blocks beyond it', () => {
    const key = `test:${Math.random()}`;
    const opts = { limit: 3, windowMs: 1000 };
    expect(rateLimit(key, opts).success).toBe(true);
    expect(rateLimit(key, opts).success).toBe(true);
    expect(rateLimit(key, opts).success).toBe(true);
    const blocked = rateLimit(key, opts);
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});

describe('validateCoupon (offline mode)', () => {
  const original = process.env.DATABASE_URL;
  beforeAll(() => {
    delete process.env.DATABASE_URL;
  });
  afterAll(() => {
    if (original) process.env.DATABASE_URL = original;
  });

  it('applies WELCOME10 above the threshold', async () => {
    const res = await validateCoupon('WELCOME10', 2000);
    expect(res.ok).toBe(true);
    expect(res.discount).toBe(200);
  });

  it('rejects WELCOME10 below the threshold', async () => {
    const res = await validateCoupon('WELCOME10', 500);
    expect(res.ok).toBe(false);
  });

  it('rejects unknown coupons', async () => {
    const res = await validateCoupon('NOPE', 5000);
    expect(res.ok).toBe(false);
  });
});
