'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FieldErrors = Record<string, string[]>;

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

export function ContactForm() {
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        error?: string;
        details?: FieldErrors;
      };
      if (!res.ok) {
        if (data.details) setFieldErrors(data.details);
        toast.error(data.error ?? 'Could not send your message');
        return;
      }
      setSent(true);
      setForm({ ...emptyForm });
      toast.success("Message sent - we'll be in touch soon!");
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="text-lg font-semibold">Thank you!</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Your message has been sent. Our team will get back to you as soon as possible.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            aria-invalid={!!fieldErrors.name}
            required
          />
          {fieldErrors.name?.[0] ? (
            <p className="text-xs font-medium text-destructive">{fieldErrors.name[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            aria-invalid={!!fieldErrors.email}
            required
          />
          {fieldErrors.email?.[0] ? (
            <p className="text-xs font-medium text-destructive">{fieldErrors.email[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            aria-invalid={!!fieldErrors.phone}
            placeholder="03XX XXXXXXX"
          />
          {fieldErrors.phone?.[0] ? (
            <p className="text-xs font-medium text-destructive">{fieldErrors.phone[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            aria-invalid={!!fieldErrors.subject}
            required
          />
          {fieldErrors.subject?.[0] ? (
            <p className="text-xs font-medium text-destructive">
              {fieldErrors.subject[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={5}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          aria-invalid={!!fieldErrors.message}
          placeholder="How can we help you?"
          required
        />
        {fieldErrors.message?.[0] ? (
          <p className="text-xs font-medium text-destructive">{fieldErrors.message[0]}</p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send message
          </>
        )}
      </Button>
    </form>
  );
}
