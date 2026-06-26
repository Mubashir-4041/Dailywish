'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Star,
  Ticket,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

// Server Components can't pass component/function props across the boundary,
// so callers pass a serializable icon name + format key instead.
const ICONS: Record<string, LucideIcon> = {
  revenue: DollarSign,
  dollar: DollarSign,
  cart: ShoppingCart,
  orders: ShoppingCart,
  users: Users,
  customers: Users,
  package: Package,
  products: Package,
  star: Star,
  ticket: Ticket,
  trending: TrendingUp,
};

export type StatIcon = keyof typeof ICONS;

interface StatCardProps {
  label: string;
  value: number;
  icon: StatIcon;
  /** How to format the animated value. */
  format?: 'number' | 'currency';
  accent?: 'primary' | 'emerald' | 'amber' | 'violet';
  hint?: string;
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  amber: 'bg-amber-500/10 text-amber-600',
  violet: 'bg-violet-500/10 text-violet-600',
};

function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = ref.current;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      setValue(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        ref.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function StatCard({
  label,
  value,
  icon,
  format = 'number',
  accent = 'primary',
  hint,
}: StatCardProps) {
  const Icon = ICONS[icon] ?? Package;
  const animated = useCountUp(value);
  const rounded = Math.round(animated);
  const display =
    format === 'currency' ? formatPrice(rounded) : rounded.toLocaleString();

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
            {display}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', accentStyles[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
