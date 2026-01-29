#!/usr/bin/env node
/**
 * Test upload: POST malaysia.geojson to the upload API.
 * Run the server first: npm run server
 * Then: node scripts/upload-test.mjs
 */
import { createReadStream, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const filePath = join(projectRoot, 'malaysia.geojson');
const apiBase = process.env.UPLOAD_API_BASE || 'http://localhost:3001';

if (!existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

const key = 'uploads/malaysia.geojson';
const body = new FormData();
body.append('file', new Blob([readFileSync(filePath)]), 'malaysia.geojson');
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
