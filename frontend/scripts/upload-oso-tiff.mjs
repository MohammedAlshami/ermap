#!/usr/bin/env node
/**
 * Upload Oso landslide GeoTIFF (oso_oli_2014018_geo.tif) to R2 via the upload API.
 * Run the server first: npm run server (or dev with API)
 * Then: node scripts/upload-oso-tiff.mjs
 *
 * Uses OSO_TIFF_PATH for input file (default: C:\Users\USER\Downloads\oso_oli_2014018_geo.tif).
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultPath = 'C:\\Users\\USER\\Downloads\\oso_oli_2014018_geo.tif';
const filePath = process.env.OSO_TIFF_PATH || defaultPath;
const apiBase = process.env.UPLOAD_API_BASE || 'http://localhost:3001';
const key = 'uploads/oso_oli_2014018_geo.tif';

if (!existsSync(filePath)) {
  console.error('File not found:', filePath);
  console.error('Set OSO_TIFF_PATH to override, or place file at default path.');
  process.exit(1);
}

const body = new FormData();
body.append('file', new Blob([readFileSync(filePath)]), 'oso_oli_2014018_geo.tif');
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
console.log('Raster URL (PNG for map):', `/api/raster/image.png?key=${encodeURIComponent(key)}`);
