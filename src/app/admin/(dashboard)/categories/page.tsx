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
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CategoryRow {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  isActive: boolean;
  order: number;
  productCount: number;
}

interface FormState {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  isActive: boolean;
  order: number;
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  image: '',
  icon: '',
  isActive: true,
  order: 0,
};

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.status === 503) {
        setNoDb(true);
        return;
      }
      const data = (await res.json()) as { data: CategoryRow[] };
      setNoDb(false);
      setRows(data.data ?? []);
    } catch {
      toast.error('Failed to load categories');
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
        isEdit ? `/api/admin/categories/${form._id}` : '/api/admin/categories',
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
      toast.success(isEdit ? 'Category updated' : 'Category created');
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
      const res = await fetch(`/api/admin/categories/${deleting._id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not delete');
        return;
      }
      toast.success('Category deleted');
      setDeleting(null);
      load();
    } catch {
      toast.error('Something went wrong');
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your catalog into shoppable collections."
        action={
          <Button onClick={() => setForm({ ...emptyForm })}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      {noDb ? <DbNotice /> : null}

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title={noDb ? 'No live data' : 'No categories yet'} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Category</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {c.image ? (
                          <Image src={c.image} alt={c.name} fill className="object-cover" sizes="40px" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">/{c.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.productCount}</TableCell>
                  <TableCell className="text-sm">{c.order}</TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? 'success' : 'outline'}>
                      {c.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setForm({
                            _id: c._id,
                            name: c.name,
                            slug: c.slug,
                            description: c.description,
                            image: c.image,
                            icon: c.icon,
                            isActive: c.isActive,
                            order: c.order,
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(c)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?._id ? 'Edit category' : 'New category'}</DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    placeholder="auto"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
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
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <ImageField
                label="Category image"
                value={form.image}
                onChange={(v) => setForm({ ...form, image: v })}
                folder="categories"
                placeholder="https://res.cloudinary.com/… or /products/…"
              />
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  placeholder="lucide name"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
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
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
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
