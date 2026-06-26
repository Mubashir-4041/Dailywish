'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  Loader2,
  MapPin,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}

type FieldErrors = Record<string, string[]>;

const emptyForm = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'Pakistan',
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function load() {
    try {
      const res = await fetch('/api/account/addresses');
      const data = (await res.json()) as { addresses?: Address[] };
      setAddresses(data.addresses ?? []);
    } catch {
      setAddresses([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSaving(true);
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        addresses?: Address[];
        error?: string;
        details?: FieldErrors;
      };
      if (!res.ok) {
        if (data.details) setFieldErrors(data.details);
        toast.error(data.error ?? 'Could not save address');
        return;
      }
      setAddresses(data.addresses ?? []);
      setForm({ ...emptyForm });
      setShowForm(false);
      toast.success('Address added');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { addresses?: Address[]; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not delete address');
        return;
      }
      setAddresses(data.addresses ?? []);
      toast.success('Address removed');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function onSetDefault(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'PATCH' });
      const data = (await res.json()) as { addresses?: Address[]; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not update address');
        return;
      }
      setAddresses(data.addresses ?? []);
      toast.success('Default address updated');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Saved addresses</CardTitle>
          {!showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Add new
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {addresses === null ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">No addresses saved</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a delivery address to speed up checkout.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className="relative flex flex-col rounded-lg border p-4"
                >
                  {addr.isDefault ? (
                    <Badge variant="accent" className="mb-2 w-fit">
                      <Star className="h-3 w-3" />
                      Default
                    </Badge>
                  ) : null}
                  <p className="font-semibold">{addr.fullName}</p>
                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.region}
                    {addr.postalCode ? ` ${addr.postalCode}` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">{addr.country}</p>

                  <div className="mt-4 flex items-center gap-2 border-t pt-3">
                    {!addr.isDefault ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === addr._id}
                        onClick={() => onSetDefault(addr._id)}
                      >
                        {busyId === addr._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Set default
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busyId === addr._id}
                      onClick={() => onDelete(addr._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Add a new address</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowForm(false);
                setForm({ ...emptyForm });
                setFieldErrors({});
              }}
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="fullName"
                  label="Full name"
                  value={form.fullName}
                  onChange={(v) => update('fullName', v)}
                  error={fieldErrors.fullName?.[0]}
                  required
                />
                <Field
                  id="phone"
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => update('phone', v)}
                  error={fieldErrors.phone?.[0]}
                  required
                />
              </div>
              <Field
                id="line1"
                label="Address line 1"
                value={form.line1}
                onChange={(v) => update('line1', v)}
                error={fieldErrors.line1?.[0]}
                required
              />
              <Field
                id="line2"
                label="Address line 2 (optional)"
                value={form.line2}
                onChange={(v) => update('line2', v)}
                error={fieldErrors.line2?.[0]}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  id="city"
                  label="City"
                  value={form.city}
                  onChange={(v) => update('city', v)}
                  error={fieldErrors.city?.[0]}
                  required
                />
                <Field
                  id="region"
                  label="Province / Region"
                  value={form.region}
                  onChange={(v) => update('region', v)}
                  error={fieldErrors.region?.[0]}
                  required
                />
                <Field
                  id="postalCode"
                  label="Postal code (optional)"
                  value={form.postalCode}
                  onChange={(v) => update('postalCode', v)}
                  error={fieldErrors.postalCode?.[0]}
                />
              </div>
              <Field
                id="country"
                label="Country"
                value={form.country}
                onChange={(v) => update('country', v)}
                error={fieldErrors.country?.[0]}
                required
              />

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isDefault}
                  onCheckedChange={(c) => update('isDefault', c === true)}
                />
                Set as my default address
              </label>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save address'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setForm({ ...emptyForm });
                    setFieldErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        required={required}
      />
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
