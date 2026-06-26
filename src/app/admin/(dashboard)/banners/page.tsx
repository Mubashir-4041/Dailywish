'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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

type Placement = 'hero' | 'promo' | 'strip';

interface BannerRow {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
  placement: Placement;
  isActive: boolean;
  order: number;
}

interface FormState extends Omit<BannerRow, '_id'> {
  _id?: string;
}

const emptyForm: FormState = {
  title: '',
  subtitle: '',
  image: '',
  ctaLabel: '',
  ctaHref: '',
  placement: 'hero',
  isActive: true,
  order: 0,
};

export default function AdminBannersPage() {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<BannerRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners');
      if (res.status === 503) {
        setNoDb(true);
        return;
      }
      const data = (await res.json()) as { data: BannerRow[] };
      setNoDb(false);
      setRows(data.data ?? []);
    } catch {
      toast.error('Failed to load banners');
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
      const res = await fetch(
        isEdit ? `/api/admin/banners/${form._id}` : '/api/admin/banners',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not save');
        return;
      }
      toast.success(isEdit ? 'Banner updated' : 'Banner created');
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
      const res = await fetch(`/api/admin/banners/${deleting._id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete');
        return;
      }
      toast.success('Banner deleted');
      setDeleting(null);
      load();
    } catch {
      toast.error('Something went wrong');
    }
  }

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Hero, promo and strip banners shown across the store."
        action={
          <Button onClick={() => setForm({ ...emptyForm })}>
            <Plus className="h-4 w-4" /> New banner
          </Button>
        }
      />

      {noDb ? <DbNotice /> : null}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title={noDb ? 'No live data' : 'No banners yet'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((b) => (
            <Card key={b._id} className="overflow-hidden">
              <div className="relative aspect-[2/1] bg-muted">
                {b.image ? (
                  <Image src={b.image} alt={b.title} fill className="object-cover" sizes="400px" />
                ) : null}
                <div className="absolute left-2 top-2 flex gap-1">
                  <Badge variant="secondary" className="capitalize">
                    {b.placement}
                  </Badge>
                  <Badge variant={b.isActive ? 'success' : 'outline'}>
                    {b.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </div>
              </div>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.title}</p>
                  {b.subtitle ? (
                    <p className="truncate text-sm text-muted-foreground">{b.subtitle}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">Order {b.order}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setForm({ ...b })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(b)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?._id ? 'Edit banner' : 'New banner'}</DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>
              <ImageField
                label="Banner image"
                value={form.image}
                onChange={(v) => setForm({ ...form, image: v })}
                folder="banners"
                placeholder="https://res.cloudinary.com/… or /banners/…"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CTA label</Label>
                  <Input
                    value={form.ctaLabel}
                    onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA link</Label>
                  <Input
                    value={form.ctaHref}
                    onChange={(e) => setForm({ ...form, ctaHref: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Placement</Label>
                  <Select
                    value={form.placement}
                    onValueChange={(v) => setForm({ ...form, placement: v as Placement })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="promo">Promo</SelectItem>
                      <SelectItem value="strip">Strip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  />
                </div>
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
            <DialogTitle>Delete “{deleting?.title}”?</DialogTitle>
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
