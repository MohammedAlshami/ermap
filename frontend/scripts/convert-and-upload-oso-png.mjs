#!/usr/bin/env node
/**
 * Convert Oso TIFF to PNG locally and upload PNG to R2.
 * Run: node scripts/convert-and-upload-oso-png.mjs
 * Then start the server (npm run server or dev). Raster layer will load /api/files/uploads/oso_oli_2014018_geo.png
 *
 * Uses OSO_TIFF_PATH for input (default: C:\Users\USER\Downloads\oso_oli_2014018_geo.tif).
 * Uses UPLOAD_API_BASE for upload (default: http://localhost:3001).
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultPath = 'C:\\Users\\USER\\Downloads\\oso_oli_2014018_geo.tif';
const filePath = process.env.OSO_TIFF_PATH || defaultPath;
const apiBase = process.env.UPLOAD_API_BASE || 'http://localhost:3001';
const key = 'uploads/oso_oli_2014018_geo.jpg';

if (!existsSync(filePath)) {
  console.error('File not found:', filePath);
  console.error('Set OSO_TIFF_PATH to override.');
  process.exit(1);
}

console.log('Converting', filePath, 'to JPEG (8-bit for Mapbox)...');
const buf = readFileSync(filePath);
let img;
try {
  img = await sharp(buf, { limit: 0 })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .normalize()
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
} catch (e) {
  try {
    img = await sharp(buf, { limit: 0, page: 0 })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .normalize()
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
  } catch (e2) {
    img = await sharp(buf, { limit: 0 }).jpeg({ quality: 90 }).toBuffer();
  }
}
console.log('JPEG size:', img.length, 'bytes');

const body = new FormData();
body.append('file', new Blob([img], { type: 'image/jpeg' }), 'oso_oli_2014018_geo.jpg');
body.append('key', key);

console.log('Uploading to', apiBase, 'as', key);
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
console.log('Raster URL:', `/api/files/${key}`);
console.log('(JPEG is 8-bit; Mapbox decodes it reliably.)');
