#!/usr/bin/env node
/**
 * Convert family_mart.json (array of stores) to GeoJSON and upload to R2 via the upload API.
 * Run the app first: npm run dev (or npm run dev:all) so /api is available.
 * Then: node scripts/upload-family-mart.mjs
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const inputPath = join(projectRoot, 'family_mart.json');
const apiBase = process.env.UPLOAD_API_BASE || 'http://localhost:3001';
const key = 'uploads/family_mart.geojson';

if (!existsSync(inputPath)) {
  console.error('File not found:', inputPath);
  process.exit(1);
}

const raw = readFileSync(inputPath, 'utf8');
let stores;
try {
  stores = JSON.parse(raw);
} catch (e) {
  console.error('Invalid JSON:', e.message);
  process.exit(1);
}

if (!Array.isArray(stores)) {
  console.error('Expected a JSON array of stores.');
  process.exit(1);
}

const features = stores.map((store) => {
  const { name, address, state, position, operating_hour, temp_close_date } = store;
  const lng = position?.lng ?? 0;
  const lat = position?.lat ?? 0;
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    properties: {
      name: name ?? '',
      address: address ?? '',
      state: state ?? '',
      operating_hour: operating_hour ?? '',
      temp_close_date: temp_close_date ?? [],
    },
  };
});

const geojson = {
  type: 'FeatureCollection',
  features,
};

const geojsonBuffer = Buffer.from(JSON.stringify(geojson), 'utf8');
console.log('Converted', features.length, 'stores to GeoJSON');

const body = new FormData();
body.append('file', new Blob([geojsonBuffer], { type: 'application/geo+json' }), 'family_mart.geojson');
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
console.log('Store locations URL:', `/api/files/${key}`);
