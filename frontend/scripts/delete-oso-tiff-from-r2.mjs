#!/usr/bin/env node
/**
 * Delete the Oso TIFF from R2 (no longer needed; we use PNG instead).
 * Run from frontend: node scripts/delete-oso-tiff-from-r2.mjs
 * Requires CLOUDFLARE_R2_* in .env.local.
 */
import { config } from 'dotenv';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '.env') });

const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
  console.error('Missing R2 env. Set CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY in .env.local');
  process.exit(1);
}

const key = 'uploads/oso_oli_2014018_geo.tif';
const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

try {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log('Deleted from R2:', key);
} catch (err) {
  console.error('Delete failed:', err.message);
  process.exit(1);
}
