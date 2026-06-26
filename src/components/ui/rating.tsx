import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
}

/** Read-only star rating with half-star support. */
export function Rating({
  value,
  size = 16,
  className,
  showValue = false,
  count,
}: RatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex" aria-label={`Rated ${value} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="text-amber-300" fill="currentColor" style={{ opacity: 0.25 }} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={size} className="text-amber-400" fill="currentColor" />
              </span>
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-foreground">{value.toFixed(1)}</span>
      )}
      {count != null && (
        <span className="text-sm text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
