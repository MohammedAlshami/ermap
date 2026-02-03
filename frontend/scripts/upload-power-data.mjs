#!/usr/bin/env node
/**
 * Upload Power_data.geojson to R2 via the upload API.
 * Run the server first: npm run server (or dev with API)
 * Then: node scripts/upload-power-data.mjs
 *
 * Uses POWER_DATA_PATH for input file (default: C:\Users\USER\Downloads\Power_data.geojson).
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const defaultPath = 'C:\\Users\\USER\\Downloads\\Power_data.geojson';
const filePath = process.env.POWER_DATA_PATH || defaultPath;
const apiBase = process.env.UPLOAD_API_BASE || 'http://localhost:3001';
const key = 'uploads/Power_data.geojson';

if (!existsSync(filePath)) {
  console.error('File not found:', filePath);
  console.error('Set POWER_DATA_PATH to override, or place file at default path.');
  process.exit(1);
}

const body = new FormData();
body.append('file', new Blob([readFileSync(filePath)]), 'Power_data.geojson');
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
console.log('Power data URL:', `/api/files/${key}`);
