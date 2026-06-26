'use client';

import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploadButton } from './image-upload-button';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Cloudinary sub-folder for uploads, e.g. "banners". */
  folder?: string;
  placeholder?: string;
}

// next/image only renders configured hosts; show a preview for those + local paths.
function canPreview(src: string): boolean {
  return (
    src.startsWith('/') ||
    /res\.cloudinary\.com|images\.unsplash\.com/.test(src)
  );
}

/** Single-image field: URL input + "upload from device" button + live preview. */
export function ImageField({
  label,
  value,
  onChange,
  folder,
  placeholder,
}: ImageFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        <ImageUploadButton
          folder={folder}
          label="Upload"
          className="shrink-0"
          onUploaded={onChange}
        />
      </div>
      {value && canPreview(value) ? (
        <div className="relative mt-1 h-20 w-20 overflow-hidden rounded-md border bg-muted">
          <Image src={value} alt="preview" fill className="object-cover" sizes="80px" />
        </div>
      ) : null}
    </div>
  );
}
