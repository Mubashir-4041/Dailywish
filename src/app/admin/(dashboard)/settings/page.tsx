'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, DbNotice } from '@/components/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { siteConfig } from '@/config/site';

interface SettingsState {
  announcement: string;
  freeShippingThreshold: number | string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
}

export default function AdminSettingsPage() {
  const [values, setValues] = useState<SettingsState>({
    announcement: '',
    freeShippingThreshold: siteConfig.shipping.freeThreshold,
    facebook: siteConfig.social.facebook,
    instagram: siteConfig.social.instagram,
    tiktok: siteConfig.social.tiktok,
    youtube: siteConfig.social.youtube,
  });
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.status === 503) {
        setNoDb(true);
        return;
      }
      const data = (await res.json()) as { data: Partial<SettingsState> };
      setNoDb(false);
      setValues((v) => ({ ...v, ...data.data }));
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          freeShippingThreshold: Number(values.freeShippingThreshold) || 0,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not save settings');
        return;
      }
      toast.success('Settings saved');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof SettingsState>(key: K, val: SettingsState[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure store-wide content and preferences."
        action={
          <Button onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        }
      />

      {noDb ? <DbNotice /> : null}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Storefront content</CardTitle>
                <CardDescription>Announcement bar and shipping rules.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Announcement text</Label>
                  <Textarea
                    rows={2}
                    placeholder="Free shipping on orders over Rs. 2,500!"
                    value={values.announcement}
                    onChange={(e) => set('announcement', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Free shipping threshold (PKR)</Label>
                  <Input
                    type="number"
                    value={values.freeShippingThreshold}
                    onChange={(e) => set('freeShippingThreshold', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social links</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input value={values.facebook} onChange={(e) => set('facebook', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input value={values.instagram} onChange={(e) => set('instagram', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>TikTok</Label>
                  <Input value={values.tiktok} onChange={(e) => set('tiktok', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>YouTube</Label>
                  <Input value={values.youtube} onChange={(e) => set('youtube', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Business info
              </CardTitle>
              <CardDescription>Read-only, from site configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Legal name" value={siteConfig.legalName} />
              <InfoRow label="Email" value={siteConfig.email} />
              <InfoRow label="Phone" value={siteConfig.phoneIntl} />
              <InfoRow label="Currency" value={siteConfig.currency} />
              <Separator />
              <p className="text-xs font-semibold uppercase text-muted-foreground">Locations</p>
              {siteConfig.locations.map((loc) => (
                <div key={loc.id}>
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.address}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}
