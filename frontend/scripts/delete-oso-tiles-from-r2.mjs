#!/usr/bin/env node
/**
 * Delete all objects under oso-tiles/ in Cloudflare R2.
 * Run from frontend dir: node scripts/delete-oso-tiles-from-r2.mjs
 * Uses .env.local for CLOUDFLARE_R2_*.
 */
import { config } from 'dotenv';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
config({ path: join(projectRoot, '.env.local') });
config({ path: join(projectRoot, '.env') });

const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
  console.error('Missing R2 env. Set CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY in .env.local');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

const PREFIX = 'oso-tiles/';
const MAX_KEYS_DELETE = 1000;

let totalDeleted = 0;
let continuationToken;

do {
  const list = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: PREFIX,
      MaxKeys: MAX_KEYS_DELETE,
      ContinuationToken: continuationToken,
    })
  );
  const keys = (list.Contents || []).map((o) => o.Key).filter(Boolean);
  if (keys.length === 0) break;
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    })
  );
  totalDeleted += keys.length;
  console.log('Deleted', totalDeleted, 'objects...');
  continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
} while (continuationToken);

console.log('Done. Deleted', totalDeleted, 'objects from', PREFIX);
