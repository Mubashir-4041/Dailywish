'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

type FieldErrors = Record<string, string[]>;

interface Me {
  name: string;
  email: string;
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);

  // Profile form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwErrors, setPwErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then(
        (data: { user?: (Me & { phone?: string }) | null }) => {
          if (!active || !data.user) return;
          setMe({ name: data.user.name, email: data.user.email });
          setName(data.user.name);
          setPhone(data.user.phone ?? '');
        },
      )
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErrors({});
    setSavingProfile(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const data = (await res.json()) as { error?: string; details?: FieldErrors };
      if (!res.ok) {
        if (data.details) setProfileErrors(data.details);
        toast.error(data.error ?? 'Could not update profile');
        return;
      }
      toast.success('Profile updated');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErrors({});
    if (newPassword !== confirm) {
      setPwErrors({ confirm: ['Passwords do not match'] });
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { error?: string; details?: FieldErrors };
      if (!res.ok) {
        if (data.details) setPwErrors(data.details);
        toast.error(data.error ?? 'Could not change password');
        return;
      }
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          {me === null ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={onSaveProfile} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" value={me.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Your email cannot be changed here.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!profileErrors.name}
                  required
                />
                {profileErrors.name?.[0] ? (
                  <p className="text-xs font-medium text-destructive">
                    {profileErrors.name[0]}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!profileErrors.phone}
                  placeholder="03XX XXXXXXX"
                />
                {profileErrors.phone?.[0] ? (
                  <p className="text-xs font-medium text-destructive">
                    {profileErrors.phone[0]}
                  </p>
                ) : null}
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Use a strong password with at least 8 characters, including upper and
            lowercase letters and a number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                aria-invalid={!!pwErrors.currentPassword}
                required
              />
              {pwErrors.currentPassword?.[0] ? (
                <p className="text-xs font-medium text-destructive">
                  {pwErrors.currentPassword[0]}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="newPassword">New password</Label>
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Show
                    </>
                  )}
                </button>
              </div>
              <Input
                id="newPassword"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                aria-invalid={!!pwErrors.newPassword}
                required
              />
              {pwErrors.newPassword?.[0] ? (
                <p className="text-xs font-medium text-destructive">
                  {pwErrors.newPassword[0]}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={!!pwErrors.confirm}
                required
              />
              {pwErrors.confirm?.[0] ? (
                <p className="text-xs font-medium text-destructive">
                  {pwErrors.confirm[0]}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={savingPw}>
              {savingPw ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
