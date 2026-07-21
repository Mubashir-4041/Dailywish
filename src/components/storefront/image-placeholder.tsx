import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Branded fallback shown when a product has no photo yet. Uses the warm
 * "Radiance" gradient + brand glyph so a missing image reads as intentional
 * (not broken) until the owner uploads a real one.
 */
export function ImagePlaceholder({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-radiance text-center',
        className,
      )}
      aria-hidden
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="font-display text-sm font-semibold text-foreground/70">DailyWish</span>
      {label ? (
        <span className="max-w-[80%] truncate text-[11px] text-muted-foreground">{label}</span>
      ) : null}
    </div>
  );
}
