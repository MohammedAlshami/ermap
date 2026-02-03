#!/usr/bin/env node
/**
 * Upload global_landslide_catalog.geojson to R2 via the upload API.
 * Run the server first: npm run server (or dev with API)
 * Then: node scripts/upload-landslide-catalog.mjs
 *
 * Uses LANDSLIDE_PATH for input file (default: public/data/malaysia/geojson/global_landslide_catalog.geojson).
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const defaultPath = join(projectRoot, 'public', 'data', 'malaysia', 'geojson', 'global_landslide_catalog.geojson');
const filePath = process.env.LANDSLIDE_PATH || defaultPath;
const apiBase = process.env.UPLOAD_API_BASE || 'http://localhost:3001';
const key = 'uploads/global_landslide_catalog.geojson';

if (!existsSync(filePath)) {
  console.error('File not found:', filePath);
  console.error('Run: node scripts/csv-to-geojson-landslide.mjs "C:\\Users\\USER\\Downloads\\archive\\Global_Landslide_Catalog_Export.csv"');
  console.error('Or set LANDSLIDE_PATH to override.');
  process.exit(1);
}

const body = new FormData();
body.append('file', new Blob([readFileSync(filePath)]), 'global_landslide_catalog.geojson');
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
console.log('Landslide catalog URL:', `/api/files/${key}`);
