import {
  registerSchema,
  loginSchema,
  checkoutSchema,
  couponApplySchema,
} from '@/lib/validations';

describe('registerSchema', () => {
  it('accepts a strong password', () => {
    const result = registerSchema.safeParse({
      name: 'Ayesha',
      email: 'ayesha@example.com',
      password: 'Secret123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a weak password', () => {
    const result = registerSchema.safeParse({
      name: 'Ayesha',
      email: 'ayesha@example.com',
      password: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('normalises email to lowercase', () => {
    const result = registerSchema.parse({
      name: 'A B',
      email: 'TEST@Example.COM',
      password: 'Secret123',
    });
    expect(result.email).toBe('test@example.com');
  });
});

describe('loginSchema', () => {
  it('requires email and password', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
  });
});

describe('checkoutSchema', () => {
  const validItem = {
    productId: 'p1',
    slug: 'face-wash',
    name: 'Face Wash',
    image: '/x.jpg',
    price: 650,
    quantity: 2,
  };
  const validAddress = {
    fullName: 'Ayesha Khan',
    phone: '03001234567',
    line1: 'Street 1',
    city: 'Swabi',
    region: 'KPK',
    country: 'Pakistan',
  };

  it('accepts a valid order', () => {
    const result = checkoutSchema.safeParse({
      email: 'a@b.com',
      items: [validItem],
      shippingAddress: validAddress,
      paymentMethod: 'cod',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty cart', () => {
    const result = checkoutSchema.safeParse({
      email: 'a@b.com',
      items: [],
      shippingAddress: validAddress,
      paymentMethod: 'cod',
    });
    expect(result.success).toBe(false);
  });
});

describe('couponApplySchema', () => {
  it('uppercases the coupon code', () => {
    const result = couponApplySchema.parse({ code: 'welcome10', subtotal: 1500 });
    expect(result.code).toBe('WELCOME10');
  });
});
