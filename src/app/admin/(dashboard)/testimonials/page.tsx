'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, DbNotice, EmptyState } from '@/components/admin/admin-ui';
import { ImageField } from '@/components/admin/image-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TestimonialRow {
  _id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  quote: string;
  isActive: boolean;
  order: number;
}

interface FormState extends Omit<TestimonialRow, '_id' | 'rating' | 'order'> {
  _id?: string;
  rating: number | string;
  order: number | string;
}

const emptyForm: FormState = {
  name: '',
  role: '',
  avatar: '',
  rating: 5,
  quote: '',
  isActive: true,
  order: 0,
};

export default function AdminTestimonialsPage() {
  const [rows, setRows] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<TestimonialRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/testimonials');
      if (res.status === 503) {
        setNoDb(true);
        return;
      }
      const data = (await res.json()) as { data: TestimonialRow[] };
      setNoDb(false);
      setRows(data.data ?? []);
    } catch {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const isEdit = !!form._id;
      const payload = { ...form, rating: Number(form.rating) || 5, order: Number(form.order) || 0 };
      const res = await fetch(
        isEdit ? `/api/admin/testimonials/${form._id}` : '/api/admin/testimonials',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not save');
        return;
      }
      toast.success(isEdit ? 'Testimonial updated' : 'Testimonial created');
      setForm(null);
      load();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${deleting._id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete');
        return;
      }
      toast.success('Testimonial deleted');
      setDeleting(null);
      load();
    } catch {
      toast.error('Something went wrong');
    }
  }

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Customer quotes shown on the storefront."
        action={
          <Button onClick={() => setForm({ ...emptyForm })}>
            <Plus className="h-4 w-4" /> New testimonial
          </Button>
        }
      />

      {noDb ? <DbNotice /> : null}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title={noDb ? 'No live data' : 'No testimonials yet'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <Card key={t._id}>
              <CardContent className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted',
                        )}
                      />
                    ))}
                  </div>
                  <Badge variant={t.isActive ? 'success' : 'outline'}>
                    {t.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </div>
                <p className="text-sm">“{t.quote}”</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    {t.role ? <p className="text-xs text-muted-foreground">{t.role}</p> : null}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setForm({ ...t })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(t)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?._id ? 'Edit testimonial' : 'New testimonial'}</DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quote</Label>
                <Textarea
                  rows={3}
                  value={form.quote}
                  onChange={(e) => setForm({ ...form, quote: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <Select
                    value={String(form.rating)}
                    onValueChange={(v) => setForm({ ...form, rating: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} ★
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                  />
                </div>
                <ImageField
                  label="Avatar"
                  value={form.avatar}
                  onChange={(v) => setForm({ ...form, avatar: v })}
                  folder="testimonials"
                  placeholder="https://res.cloudinary.com/…"
                />
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">Active</span>
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(c) => setForm({ ...form, isActive: c === true })}
                />
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete testimonial from “{deleting?.name}”?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
