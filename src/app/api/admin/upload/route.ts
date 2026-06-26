import type { NextRequest } from 'next/server';
import { handler, ok, fail } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { isCloudinaryConfigured, uploadImageBuffer } from '@/lib/cloudinary';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

/**
 * Admin-only image upload. Accepts multipart/form-data with a `file` field and
 * an optional `folder` sub-path, streams the bytes to Cloudinary, and returns
 * the secure URL. Secrets stay server-side; the browser only gets the URL back.
 */
export const POST = handler(async (req: NextRequest) => {
  await requireRole();

  if (!isCloudinaryConfigured) {
    return fail(503, 'Image uploads are not configured. Set CLOUDINARY_* in the environment.');
  }

  const form = await req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return fail(400, 'No file provided. Attach an image under the "file" field.');
  }
  if (!ALLOWED.includes(file.type)) {
    return fail(415, 'Unsupported file type. Use JPEG, PNG, WebP, AVIF or GIF.');
  }
  if (file.size > MAX_BYTES) {
    return fail(413, 'File too large. Maximum size is 8 MB.');
  }

  // Keep folders inside the dailywish namespace; strip anything unexpected.
  const sub = String(form.get('folder') ?? 'uploads')
    .replace(/[^a-z0-9/_-]/gi, '')
    .replace(/^\/+|\/+$/g, '') || 'uploads';

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImageBuffer(buffer, {
    folder: `dailywish/${sub}`,
    mimetype: file.type,
  });

  return ok({
    url: result.url,
    publicId: result.publicId,
    width: result.width,
    height: result.height,
  });
});
