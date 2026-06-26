import {
  formatPrice,
  slugify,
  discountPercent,
  truncate,
  averageRating,
  generateOrderNumber,
} from '@/lib/utils';

describe('formatPrice', () => {
  it('formats PKR without decimals by default', () => {
    expect(formatPrice(650)).toContain('650');
    expect(formatPrice(650)).toMatch(/Rs|PKR|₨/);
  });
});

describe('slugify', () => {
  it('creates SEO-friendly slugs', () => {
    expect(slugify('Vitamin C Whitening Face Wash!')).toBe(
      'vitamin-c-whitening-face-wash',
    );
    expect(slugify('  24K  Gold  ')).toBe('24k-gold');
  });
});

describe('discountPercent', () => {
  it('computes a rounded discount', () => {
    expect(discountPercent(650, 850)).toBe(24);
  });
  it('returns 0 when there is no valid compare price', () => {
    expect(discountPercent(850, 650)).toBe(0);
    expect(discountPercent(650)).toBe(0);
  });
});

describe('truncate', () => {
  it('truncates long strings with an ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello…');
    expect(truncate('hi', 5)).toBe('hi');
  });
});

describe('averageRating', () => {
  it('averages ratings to one decimal', () => {
    expect(averageRating([5, 4, 4])).toBe(4.3);
    expect(averageRating([])).toBe(0);
  });
});

describe('generateOrderNumber', () => {
  it('produces a unique DW-prefixed order number', () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    expect(a).toMatch(/^DW-/);
    expect(a).not.toBe(b);
  });
});
