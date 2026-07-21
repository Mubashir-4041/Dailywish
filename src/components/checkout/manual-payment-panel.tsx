'use client';

import * as React from 'react';
import Image from 'next/image';
import { Check, Copy, Loader2, Smartphone, Upload, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn, formatPrice } from '@/lib/utils';

type Wallet = { number: string; accountName: string };
type PaymentsInfo = { easypaisa: Wallet; jazzcash: Wallet };

const METHOD_LABEL: Record<'easypaisa' | 'jazzcash', string> = {
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
};

/**
 * Instructions + screenshot uploader for a manual mobile-wallet order. Shows the
 * wallet number to send money to, then lets the customer attach their payment
 * screenshot. An admin verifies it afterwards — this panel never marks paid.
 */
export function ManualPaymentPanel({
  orderNumber,
  amount,
  method,
  paymentStatus,
  initialProofUrl,
  onUploaded,
}: {
  orderNumber: string;
  amount: number;
  method: 'easypaisa' | 'jazzcash';
  paymentStatus: string;
  initialProofUrl?: string | null;
  onUploaded?: (url: string) => void;
}) {
  const [wallet, setWallet] = React.useState<Wallet | null>(null);
  const [proofUrl, setProofUrl] = React.useState<string | null>(initialProofUrl ?? null);
  const [uploading, setUploading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetch('/api/payment-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { payments?: PaymentsInfo } | null) => {
        if (d?.payments) setWallet(d.payments[method]);
      })
      .catch(() => undefined);
  }, [method]);

  const isPaid = paymentStatus === 'paid';
  const label = METHOD_LABEL[method];

  async function copyNumber() {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.number.replace(/[^0-9]/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked — ignore */
    }
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/payment-proof`, {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as { paymentProofUrl?: string; error?: string };
      if (!res.ok || !data.paymentProofUrl) {
        toast.error(data.error ?? 'Could not upload the screenshot. Please try again.');
        return;
      }
      setProofUrl(data.paymentProofUrl);
      onUploaded?.(data.paymentProofUrl);
      toast.success('Screenshot uploaded — we’ll verify your payment shortly.');
    } catch {
      toast.error('Something went wrong while uploading. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 text-left">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Smartphone className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="font-semibold leading-tight">Pay with {label}</p>
          <p className="text-xs text-muted-foreground">Send the exact amount, then upload your screenshot.</p>
        </div>
      </div>

      {/* Amount + number */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
          <span className="text-sm text-muted-foreground">Amount to send</span>
          <span className="font-display text-lg font-bold">{formatPrice(amount)}</span>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label} number</p>
              <p className="truncate font-mono text-lg font-semibold">
                {wallet ? wallet.number : '···'}
              </p>
              {wallet?.accountName ? (
                <p className="text-xs text-muted-foreground">Account title: {wallet.accountName}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyNumber}
              disabled={!wallet}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
        {[
          `Open your ${label} app and send ${formatPrice(amount)} to the number above.`,
          'Take a screenshot of the successful payment confirmation.',
          'Upload that screenshot below so we can verify and dispatch your order.',
        ].map((step, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <Separator className="my-4" />

      {/* Upload / status */}
      {isPaid ? (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <ShieldCheck className="h-4 w-4" /> Payment verified. Thank you!
        </p>
      ) : proofUrl ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            <Check className="h-4 w-4" /> Screenshot received — we’re verifying your payment. You’ll get an
            email once it’s confirmed.
          </p>
          <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
            <div className="relative h-28 w-24 overflow-hidden rounded-md border bg-muted">
              <Image src={proofUrl} alt="Payment screenshot" fill className="object-cover" sizes="96px" />
            </div>
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Replace screenshot
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          className={cn('w-full', uploading && 'pointer-events-none')}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Upload payment screenshot'}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
