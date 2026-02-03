#!/usr/bin/env node
/**
 * Tile the Oso raster (TIFF or JPEG) into XYZ tiles and upload to Cloudflare R2.
 * Creates folder: oso-tiles/{z}/{x}/{y}.png in R2.
 *
 * Run: node scripts/tile-and-upload-oso.mjs
 * Requires: OSO_TIFF_PATH (or default), UPLOAD_API_BASE (default http://localhost:3001).
 * Start the frontend (npm run dev) so /api/upload is available.
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultPath = process.platform === 'win32'
  ? 'C:\\Users\\USER\\Downloads\\oso_oli_2014018_geo.tif'
  : `${process.env.HOME || ''}/Downloads/oso_oli_2014018_geo.tif`;
const filePath = process.env.OSO_TIFF_PATH || defaultPath;
const apiBase = (process.env.UPLOAD_API_BASE || 'http://localhost:3001').replace(/\/+$/, '');
const TILE_LAYER = 'oso';
const ZOOM_LEVEL = 12; // single zoom level only
const TILE_SIZE = 256;

// Oso bounds [[minLng, minLat], [maxLng, maxLat]]
const BOUNDS = [[-122.5, 48.15], [-122.15, 48.4]];
const [minLng, minLat] = BOUNDS[0];
const [maxLng, maxLat] = BOUNDS[1];

function lngLatToTile(lng, lat, z) {
  const n = 1 << z;
  let x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  let y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  x = Math.max(0, Math.min(n - 1, x));
  y = Math.max(0, Math.min(n - 1, y));
  return { x, y };
}

function tileToBounds(z, x, y) {
  const n = 1 << z;
  const lngMin = (x / n) * 360 - 180;
  const lngMax = ((x + 1) / n) * 360 - 180;
  const toLat = (y) => {
    const rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    return (rad * 180) / Math.PI;
  };
  const latMax = toLat(y);
  const latMin = toLat(y + 1);
  return { lngMin, lngMax, latMin, latMax };
}

if (!existsSync(filePath)) {
  console.error('File not found:', filePath);
  console.error('Set OSO_TIFF_PATH to override.');
  process.exit(1);
}

console.log('Loading image:', filePath);
const buf = readFileSync(filePath);
const sharpOpts = { limit: 0 };
if (filePath.toLowerCase().endsWith('.tif') || filePath.toLowerCase().endsWith('.tiff')) {
  sharpOpts.page = 0;
}
let image = sharp(buf, sharpOpts);
const meta = await image.metadata();
const imgWidth = meta.width || 0;
const imgHeight = meta.height || 0;
if (!imgWidth || !imgHeight) {
  console.error('Could not get image dimensions');
  process.exit(1);
}
image = image.ensureAlpha();
console.log('Image size:', imgWidth, 'x', imgHeight);

// Bounds to pixel: (lng, lat) -> (px, py) where py=0 is top
function lngLatToPixel(lng, lat) {
  const px = ((lng - minLng) / (maxLng - minLng)) * imgWidth;
  const py = (1 - (lat - minLat) / (maxLat - minLat)) * imgHeight;
  return { px, py };
}

async function uploadTile(z, x, y, pngBuffer) {
  const key = `${TILE_LAYER}-tiles/${z}/${x}/${y}.png`;
  const body = new FormData();
  body.append('file', new Blob([pngBuffer], { type: 'image/png' }), `${z}_${x}_${y}.png`);
  body.append('key', key);
  const res = await fetch(`${apiBase}/api/upload`, { method: 'POST', body });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Upload ${key}: ${res.status} ${JSON.stringify(data)}`);
  }
}

let total = 0;
const z = ZOOM_LEVEL;
{
  const tl = lngLatToTile(minLng, maxLat, z);
  const br = lngLatToTile(maxLng, minLat, z);
  const xMin = Math.min(tl.x, br.x);
  const xMax = Math.max(tl.x, br.x);
  const yMin = Math.min(tl.y, br.y);
  const yMax = Math.max(tl.y, br.y);

  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      const { lngMin, lngMax, latMin, latMax } = tileToBounds(z, x, y);
      const topLeft = lngLatToPixel(lngMin, latMax);
      const bottomRight = lngLatToPixel(lngMax, latMin);
      const left = Math.max(0, Math.floor(topLeft.px));
      const top = Math.max(0, Math.floor(topLeft.py));
      const right = Math.min(imgWidth, Math.ceil(bottomRight.px));
      const bottom = Math.min(imgHeight, Math.ceil(bottomRight.py));
      const w = Math.max(1, right - left);
      const h = Math.max(1, bottom - top);

      const tileBuffer = await sharp(buf, sharpOpts)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .extract({ left, top, width: w, height: h })
        .resize(TILE_SIZE, TILE_SIZE, { fit: 'fill' })
        .png()
        .toBuffer();

      await uploadTile(z, x, y, tileBuffer);
      total++;
      if (total % 20 === 0) console.log('Uploaded', total, 'tiles...');
    }
  }
}

console.log('Done. Uploaded', total, 'tiles to R2 folder:', `${TILE_LAYER}-tiles/`);
console.log('Tile URL template:', `${apiBase}/api/tiles/${TILE_LAYER}/{z}/{x}/{y}.png`);
console.log('Zoom level:', ZOOM_LEVEL, 'only');
