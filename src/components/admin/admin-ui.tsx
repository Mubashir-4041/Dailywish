import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BadgeProps } from '@/components/ui/badge';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function DbNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900',
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-semibold">Demo mode.</span> Showing sample data. Connect{' '}
        <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[12px]">DATABASE_URL</code>{' '}
        for live data and to enable saving changes.
      </p>
    </div>
  );
}

const orderStatusVariant: Record<string, BadgeProps['variant']> = {
  pending: 'outline',
  confirmed: 'secondary',
  processing: 'secondary',
  shipped: 'accent',
  delivered: 'success',
  cancelled: 'destructive',
  refunded: 'destructive',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={orderStatusVariant[status] ?? 'outline'} className="capitalize">
      {status}
    </Badge>
  );
}

const paymentVariant: Record<string, BadgeProps['variant']> = {
  paid: 'success',
  pending: 'outline',
  failed: 'destructive',
  refunded: 'destructive',
};

export function PaymentBadge({ status }: { status: string }) {
  return (
    <Badge variant={paymentVariant[status] ?? 'outline'} className="capitalize">
      {status}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
