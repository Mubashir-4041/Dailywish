'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, DbNotice, EmptyState } from '@/components/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
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
import { formatPrice, formatDate } from '@/lib/utils';

interface CouponRow {
  _id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

interface FormState {
  _id?: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number | string;
  minSubtotal: number | string;
  maxDiscount: number | string;
  usageLimit: number | string;
  isActive: boolean;
  expiresAt: string;
}

const emptyForm: FormState = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minSubtotal: 0,
  maxDiscount: '',
  usageLimit: '',
  isActive: true,
  expiresAt: '',
};

export default function AdminCouponsPage() {
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<CouponRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.status === 503) {
        setNoDb(true);
        return;
      }
      const data = (await res.json()) as { data: CouponRow[] };
      setNoDb(false);
      setRows(data.data ?? []);
    } catch {
      toast.error('Failed to load coupons');
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
      const payload = {
        code: form.code,
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value) || 0,
        minSubtotal: Number(form.minSubtotal) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        isActive: form.isActive,
        expiresAt: form.expiresAt || undefined,
      };
      const res = await fetch(
        isEdit ? `/api/admin/coupons/${form._id}` : '/api/admin/coupons',
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
      toast.success(isEdit ? 'Coupon updated' : 'Coupon created');
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
      const res = await fetch(`/api/admin/coupons/${deleting._id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete');
        return;
      }
      toast.success('Coupon deleted');
      setDeleting(null);
      load();
    } catch {
      toast.error('Something went wrong');
    }
  }

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Create discount codes and run promotions."
        action={
          <Button onClick={() => setForm({ ...emptyForm })}>
            <Plus className="h-4 w-4" /> New coupon
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
            <EmptyState title={noDb ? 'No live data' : 'No coupons yet'} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min spend</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="pl-6">
                    <p className="font-mono font-semibold">{c.code}</p>
                    {c.description ? (
                      <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-medium">
                    {c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}
                  </TableCell>
                  <TableCell className="text-sm">{formatPrice(c.minSubtotal)}</TableCell>
                  <TableCell className="text-sm">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.expiresAt ? formatDate(c.expiresAt) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? 'success' : 'outline'}>
                      {c.isActive ? 'Active' : 'Inactive'}
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
                            code: c.code,
                            description: c.description,
                            type: c.type,
                            value: c.value,
                            minSubtotal: c.minSubtotal,
                            maxDiscount: c.maxDiscount ?? '',
                            usageLimit: c.usageLimit ?? '',
                            isActive: c.isActive,
                            expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
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
            <DialogTitle>{form?._id ? 'Edit coupon' : 'New coupon'}</DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as 'percentage' | 'fixed' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min subtotal</Label>
                  <Input
                    type="number"
                    value={form.minSubtotal}
                    onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Max discount</Label>
                  <Input
                    type="number"
                    placeholder="optional"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Usage limit</Label>
                  <Input
                    type="number"
                    placeholder="optional"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expires at</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            <DialogTitle>Delete coupon “{deleting?.code}”?</DialogTitle>
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
