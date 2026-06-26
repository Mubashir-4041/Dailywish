'use client';
import * as React from 'react';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Rating } from '@/components/ui/rating';
import { Badge } from '@/components/ui/badge';

interface ReviewItem {
  _id: string;
  name: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

export function ProductReviews({
  productId,
  initialRating,
  initialCount,
}: {
  productId: string;
  initialRating: number;
  initialCount: number;
}) {
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [rating, setRating] = React.useState(5);
  const [hover, setHover] = React.useState(0);
  const [form, setForm] = React.useState({ name: '', title: '', comment: '' });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit review');
      toast.success(data.message ?? 'Review submitted!');
      setForm({ name: '', title: '', comment: '' });
      setRating(5);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
      {/* Summary + form */}
      <div>
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-5xl font-bold">{initialRating.toFixed(1)}</p>
          <Rating value={initialRating} className="mt-2 justify-center" size={20} />
          <p className="mt-1 text-sm text-muted-foreground">
            Based on {initialCount} review{initialCount === 1 ? '' : 's'}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border bg-card p-6">
          <h4 className="font-semibold">Write a review</h4>
          <div>
            <Label className="mb-1.5 block">Your rating</Label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHover(i + 1)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${i + 1} star`}
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors',
                      (hover || rating) > i
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="rv-name" className="mb-1.5 block">Name</Label>
            <Input
              id="rv-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="rv-title" className="mb-1.5 block">Title (optional)</Label>
            <Input
              id="rv-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="rv-comment" className="mb-1.5 block">Your review</Label>
            <Textarea
              id="rv-comment"
              required
              rows={4}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
          </Button>
        </form>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.name}</span>
                  {r.isVerifiedPurchase && (
                    <Badge variant="success" className="text-[10px]">Verified</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
              </div>
              <Rating value={r.rating} className="mt-1.5" size={14} />
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}
              <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
