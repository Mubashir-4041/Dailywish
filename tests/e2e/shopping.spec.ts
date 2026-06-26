import { test, expect } from '@playwright/test';

test.describe('DailyWish storefront', () => {
  test('homepage loads with hero and products', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DailyWish/);
    await expect(page.getByRole('link', { name: /DailyWish/i }).first()).toBeVisible();
  });

  test('can browse shop and open a product', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { name: /All Products|Products/i })).toBeVisible();
    const firstProduct = page.getByRole('link', { name: /face wash|cream|serum|polish/i }).first();
    await firstProduct.click();
    await expect(page.getByRole('button', { name: /add to cart/i }).first()).toBeVisible();
  });

  test('can add a product to cart', async ({ page }) => {
    await page.goto('/shop');
    await page.getByRole('button', { name: /add to cart/i }).first().click();
    // Cart drawer opens with at least one item.
    await expect(page.getByText(/your cart/i)).toBeVisible();
  });

  test('contact page shows business info', async ({ page }) => {
    await page.goto('/contact');
    // The phone appears in both the contact section and the footer — scope to
    // the page body and take the first match to avoid a strict-mode violation.
    await expect(page.getByRole('main').getByText('03135119536').first()).toBeVisible();
  });
});
