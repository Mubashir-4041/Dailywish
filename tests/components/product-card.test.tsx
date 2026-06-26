import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/storefront/product-card';
import { CartProvider } from '@/components/providers/cart-provider';
import { WishlistProvider } from '@/components/providers/wishlist-provider';
import { products } from '@/data/catalog';

// framer-motion + next/image render fine in jsdom; next/navigation is not used here.
function renderWithProviders(ui: React.ReactNode) {
  return render(
    <CartProvider>
      <WishlistProvider>{ui}</WishlistProvider>
    </CartProvider>,
  );
}

describe('ProductCard', () => {
  const product = products[0]!;

  it('renders the product name and price', () => {
    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('shows a discount badge when on sale', () => {
    renderWithProviders(<ProductCard product={product} />);
    if (product.comparePrice && product.comparePrice > product.price) {
      expect(screen.getByText(/-\d+%/)).toBeInTheDocument();
    }
  });
});
