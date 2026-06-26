import { ProductCard } from './product-card';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

export function ProductGrid({
  products,
  className,
}: {
  products: Product[];
  className?: string;
}) {
  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        No products found.
      </div>
    );
  }
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4',
        className,
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={p._id} product={p} index={i} />
      ))}
    </div>
  );
}
