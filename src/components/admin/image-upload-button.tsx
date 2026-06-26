'use client';

import * as React from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadButtonProps {
  /** Cloudinary sub-folder (under `dailywish/`), e.g. "products". */
  folder?: string;
  /** Called once per successfully uploaded file with its Cloudinary URL. */
  onUploaded: (url: string) => void;
  /** Allow selecting multiple files at once. */
  multiple?: boolean;
  label?: string;
  className?: string;
}

/**
 * Admin helper: pick image file(s) from the device, upload them to Cloudinary
 * via `/api/admin/upload`, and hand back the resulting URL(s).
 */
export function ImageUploadButton({
  folder,
  onUploaded,
  multiple = false,
  label = 'Upload from device',
  className,
}: ImageUploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let ok = 0;
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        if (folder) fd.append('folder', folder);

        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          toast.error(data.error ?? `Failed to upload ${file.name}`);
          continue;
        }
        onUploaded(data.url);
        ok += 1;
      }
      if (ok > 0) toast.success(`Uploaded ${ok} image${ok > 1 ? 's' : ''}`);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn(className)}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {busy ? 'Uploading…' : label}
      </Button>
    </>
  );
}
