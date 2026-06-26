import 'server-only';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/lib/env';

/**
 * Server-only Cloudinary client. Credentials come from the environment and are
 * never exposed to the browser. Image uploads/transforms run on the server
 * (admin routes, scripts); the storefront only ever receives the resulting URLs.
 */
export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function assertConfigured() {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
    );
  }
}

/** Verify the credentials are valid by pinging the Cloudinary API. */
export async function pingCloudinary() {
  assertConfigured();
  return cloudinary.api.ping();
}

/**
 * Upload an image (local path, remote URL, or data URI) to Cloudinary and
 * return the secure URL + public id.
 */
export async function uploadImage(
  file: string,
  opts: { folder?: string; publicId?: string } = {},
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  assertConfigured();
  const res = await cloudinary.uploader.upload(file, {
    folder: opts.folder ?? 'dailywish',
    public_id: opts.publicId,
    resource_type: 'image',
    overwrite: true,
  });
  return {
    url: res.secure_url,
    publicId: res.public_id,
    width: res.width,
    height: res.height,
  };
}

/** Upload raw image bytes (e.g. from a multipart form upload) to Cloudinary. */
export async function uploadImageBuffer(
  buffer: Buffer,
  opts: { folder?: string; publicId?: string; mimetype?: string } = {},
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  const dataUri = `data:${opts.mimetype ?? 'image/jpeg'};base64,${buffer.toString('base64')}`;
  return uploadImage(dataUri, { folder: opts.folder, publicId: opts.publicId });
}

/** Delete an uploaded asset by its public id. */
export async function deleteImage(publicId: string) {
  assertConfigured();
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Derive a Cloudinary `public_id` from a delivery URL. We never persisted the
 * public_id on product images (only the URL), so we reconstruct it here.
 * Returns null for non-Cloudinary URLs (local/brand assets) so they're skipped.
 *
 *   https://res.cloudinary.com/<cloud>/image/upload/v123/dailywish/products/facewash-1.jpg
 *     → dailywish/products/facewash-1
 */
export function publicIdFromUrl(url: string): string | null {
  try {
    if (!url.includes('res.cloudinary.com')) return null;
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return null;
    let rest = parts.slice(uploadIdx + 1);
    // Drop the version segment (vNNN) and anything before it (transformations).
    const vIdx = rest.findIndex((p) => /^v\d+$/.test(p));
    if (vIdx !== -1) rest = rest.slice(vIdx + 1);
    if (!rest.length) return null;
    // Strip the file extension from the final segment.
    rest[rest.length - 1] = rest[rest.length - 1]!.replace(/\.[^./]+$/, '');
    const id = rest.join('/');
    return id || null;
  } catch {
    return null;
  }
}

/**
 * Best-effort deletion of Cloudinary assets given their delivery URLs. Skips
 * non-Cloudinary URLs and never throws — orphaned-image cleanup must not block
 * the operation that triggered it (e.g. deleting a product). Returns counts.
 */
export async function deleteImagesByUrl(
  urls: string[],
): Promise<{ deleted: number; skipped: number; failed: number }> {
  if (!isCloudinaryConfigured) return { deleted: 0, skipped: urls.length, failed: 0 };
  const publicIds = [
    ...new Set(
      urls.map(publicIdFromUrl).filter((id): id is string => Boolean(id)),
    ),
  ];
  const skipped = urls.length - publicIds.length;
  let deleted = 0;
  let failed = 0;
  await Promise.all(
    publicIds.map(async (id) => {
      try {
        await cloudinary.uploader.destroy(id, { resource_type: 'image', invalidate: true });
        deleted += 1;
      } catch {
        failed += 1;
      }
    }),
  );
  return { deleted, skipped, failed };
}

export { cloudinary };
