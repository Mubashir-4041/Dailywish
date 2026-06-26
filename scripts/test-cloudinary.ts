/**
 * Verify Cloudinary credentials end-to-end: ping → upload → delete.
 *
 * Usage:  npm run test:cloudinary
 * Requires CLOUDINARY_* vars in .env.local
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { v2 as cloudinary } from 'cloudinary';

// 1x1 transparent PNG — no external dependency for the upload round-trip.
const SAMPLE_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function main() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !key || !secret) {
    console.error('❌ Missing Cloudinary env vars. Set CLOUDINARY_* in .env.local');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloud,
    api_key: key,
    api_secret: secret,
    secure: true,
  });

  console.log(`→ Pinging Cloudinary (cloud: ${cloud})…`);
  const ping = await cloudinary.api.ping();
  console.log('✅ Ping:', ping.status);

  console.log('→ Uploading a test image…');
  const up = await cloudinary.uploader.upload(SAMPLE_IMAGE, {
    folder: 'dailywish/_healthcheck',
    public_id: 'connectivity-test',
    overwrite: true,
  });
  console.log('✅ Uploaded:', up.secure_url);

  console.log('→ Cleaning up…');
  await cloudinary.uploader.destroy(up.public_id);
  console.log('✅ Cleanup done. Cloudinary is working. 🎉');
}

main().catch((e) => {
  console.error('❌ Cloudinary test failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
