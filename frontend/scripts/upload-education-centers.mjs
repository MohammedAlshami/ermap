#!/usr/bin/env node
/**
 * Upload Education_Centers_Malaysia.geojson to R2 via the upload API.
 * Run the app first: npm run dev (or npm run server in another terminal)
 * Then: node scripts/upload-education-centers.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const filePath = join(projectRoot, 'Education_Centers_Malaysia.geojson');
const apiBase = process.env.UPLOAD_API_BASE || 'http://localhost:3001';
const key = 'uploads/Education_Centers_Malaysia.geojson';

if (!existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

const body = new FormData();
body.append('file', new Blob([readFileSync(filePath)]), 'Education_Centers_Malaysia.geojson');
body.append('key', key);

console.log('Uploading', filePath, 'to', apiBase, 'as', key);
const res = await fetch(`${apiBase}/api/upload`, {
  method: 'POST',
  body,
});
const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('Upload failed:', res.status, data);
  process.exit(1);
}
console.log('Upload OK:', data);
