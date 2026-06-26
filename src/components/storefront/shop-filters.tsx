'use client';
import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Category } from '@/types';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'bestselling', label: 'Best Selling' },
  { value: 'rating', label: 'Top Rated' },
];

export function ShopToolbar({
  categories,
  total,
}: {
  categories: Category[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sort = params.get('sort') ?? 'featured';

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {total} product{total === 1 ? '' : 's'}
      </p>
      <div className="flex items-center gap-2">
        {/* Mobile filter trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto">
              <FilterControls categories={categories} />
            </div>
          </SheetContent>
        </Sheet>

        <Select value={sort} onValueChange={(v) => setParam('sort', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function FilterControls({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeCategory = params.get('category') ?? '';
  const [min, setMin] = React.useState(params.get('minPrice') ?? '');
  const [max, setMax] = React.useState(params.get('maxPrice') ?? '');

  function update(mut: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mut(next);
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  }

  const hasFilters = activeCategory || params.get('minPrice') || params.get('maxPrice') || params.get('search');

  return (
    <div className="space-y-6">
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => router.push(pathname)}
        >
          <X className="h-4 w-4" /> Clear all filters
        </Button>
      )}

      <div>
        <h4 className="mb-3 text-sm font-semibold">Category</h4>
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={!activeCategory}
              onCheckedChange={() => update((p) => p.delete('category'))}
            />
            All Products
          </label>
          {categories.map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={activeCategory === c.slug}
                onCheckedChange={(checked) =>
                  update((p) => (checked ? p.set('category', c.slug) : p.delete('category')))
                }
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Price (PKR)</h4>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="h-9"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="h-9"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          onClick={() =>
            update((p) => {
              if (min) p.set('minPrice', min);
              else p.delete('minPrice');
              if (max) p.set('maxPrice', max);
              else p.delete('maxPrice');
            })
          }
        >
          Apply Price
        </Button>
      </div>
    </div>
  );
}
