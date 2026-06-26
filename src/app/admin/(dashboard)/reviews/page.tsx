'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Check, X, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, DbNotice, EmptyState } from '@/components/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';

interface ReviewRow {
  _id: string;
  productName: string;
  name: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '50' });
      if (filter !== 'all') params.set('filter', filter);
      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (res.status === 503) {
        setNoDb(true);
        setRows([]);
        return;
      }
      const data = (await res.json()) as { data: ReviewRow[] };
      setNoDb(false);
      setRows(data.data ?? []);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setApproval(id: string, isApproved: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        toast.error(d.error ?? 'Could not update');
        return;
      }
      toast.success(isApproved ? 'Review approved' : 'Review unapproved');
      load();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete');
        return;
      }
      toast.success('Review deleted');
      load();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Moderate customer reviews before they appear on the storefront."
        action={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {noDb ? <DbNotice /> : null}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title={noDb ? 'No live data' : 'No reviews to show'} />
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r._id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted',
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{r.name}</span>
                    {r.isVerifiedPurchase ? (
                      <Badge variant="success">Verified</Badge>
                    ) : null}
                    <Badge variant={r.isApproved ? 'success' : 'outline'}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  {r.title ? <p className="mt-2 font-semibold">{r.title}</p> : null}
                  <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    On <span className="font-medium">{r.productName}</span> · {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.isApproved ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === r._id}
                      onClick={() => setApproval(r._id, false)}
                    >
                      <X className="h-4 w-4" /> Unapprove
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={busyId === r._id}
                      onClick={() => setApproval(r._id, true)}
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busyId === r._id}
                    onClick={() => remove(r._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
