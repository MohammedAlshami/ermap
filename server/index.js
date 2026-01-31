import { config } from 'dotenv';
import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { createReadStream, existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import geojsonvt from 'geojson-vt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const TILE_EXTENT = 4096;
const FILL_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#f97316',
];

/** In-memory cache: key -> { geojson, tileIndex } */
const tileCache = new Map();

function tileToLngLat(z, x, y, px, py, extent) {
  const z2 = 1 << z;
  const xMerc = (x + px / extent) / z2;
  const yMerc = (y + py / extent) / z2;
  const lng = xMerc * 360 - 180;
  const lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(Math.PI - 2 * Math.PI * yMerc)) - Math.PI / 2);
  return [lng, lat];
}

function tileFeatureToGeoJSON(tile, f, extent) {
  const { z, x, y } = tile;
  const toLngLat = (px, py) => tileToLngLat(z, x, y, px, py, extent);
  let geometry;
  const geom = f.geometry;
  // geojson-vt getTile returns *transformed* tiles: type 1 = array of [x,y] pairs, type 2/3 = array of rings (each ring = array of [x,y])
  if (f.type === 1) {
    const points = geom.map((pt) => toLngLat(Number(pt[0]), Number(pt[1])));
    geometry = points.length === 1 ? { type: 'Point', coordinates: points[0] } : { type: 'MultiPoint', coordinates: points };
  } else if (f.type === 2) {
    const coords = geom.map((ring) => ring.map((c) => toLngLat(Number(c[0]), Number(c[1]))));
    geometry = coords.length === 1 ? { type: 'LineString', coordinates: coords[0] } : { type: 'MultiLineString', coordinates: coords };
  } else {
    const coords = geom.map((ring) => ring.map((c) => toLngLat(Number(c[0]), Number(c[1]))));
    geometry = { type: 'Polygon', coordinates: coords };
  }
  const props = { ...(f.tags || {}) };
  const feature = { type: 'Feature', properties: props, geometry };
  if (f.id != null) feature.id = f.id;
  return feature;
}

function getTilesInBounds(bounds, z) {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  const n = 1 << z;
  const lngToX = (lng) => Math.floor(((lng + 180) / 360) * n);
  const latToY = (lat) => {
    const latRad = (lat * Math.PI) / 180;
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
    return Math.floor(y * n);
  };
  const xMin = Math.max(0, lngToX(minLng));
  const xMax = Math.min(n - 1, lngToX(maxLng));
  const yMin = Math.max(0, latToY(maxLat));
  const yMax = Math.min(n - 1, latToY(minLat));
  const tiles = [];
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) tiles.push({ z, x, y });
  }
  return tiles;
}

function getBoundsFromGeoJSON(geojson) {
  const coords = [];
  const visit = (c) => {
    if (Array.isArray(c)) {
      if (c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number') coords.push([c[0], c[1]]);
      else c.forEach(visit);
    }
  };
  (geojson.features || []).forEach((f) => {
    const g = f.geometry;
    if (!g) return;
    if (g.type === 'Point') visit(g.coordinates);
    if (g.type === 'LineString') visit(g.coordinates);
    if (g.type === 'Polygon') visit(g.coordinates);
    if (g.type === 'MultiPoint') visit(g.coordinates);
    if (g.type === 'MultiLineString') visit(g.coordinates);
    if (g.type === 'MultiPolygon') visit(g.coordinates);
  });
  if (coords.length === 0) return null;
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

// Fallback: key -> path under public/ when R2 returns 404 (Education is R2-only, no local fallback)
const keyToLocalPath = {
  'uploads/malaysia.geojson': 'data/malaysia/geojson/malaysia.geojson',
  'ermap/uploads/malaysia.geojson': 'data/malaysia/geojson/malaysia.geojson',
};

// Load .env.local first (Vite uses it; Node doesn't by default)
config({ path: '.env.local' });
config(); // fallback to .env

const app = express();
const PORT = Number(process.env.UPLOAD_SERVER_PORT) || 3002;

const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
  console.error('Missing R2 env: CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.options('*', (_req, res) => res.sendStatus(204));

const MAPBOX_ORIGINS = ['https://api.mapbox.com', 'https://events.mapbox.com', 'https://tiles.mapbox.com'];

// GET /mapbox-proxy?url=... – proxy Mapbox base map tiles/styles server-side
app.get('/mapbox-proxy', async (req, res) => {
  const raw = req.query.url;
  if (!raw || typeof raw !== 'string') return res.status(400).json({ error: 'Missing url' });
  let url;
  try {
    url = decodeURIComponent(raw);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }
  const allowed = MAPBOX_ORIGINS.some((origin) => url.startsWith(origin + '/') || url === origin);
  if (!allowed) return res.status(403).json({ error: 'URL not allowed' });
  try {
    const resp = await fetch(url, { headers: { Accept: req.headers.accept || '*/*' } });
    if (!resp.ok) {
      res.status(resp.status).end();
      return;
    }
    const ct = resp.headers.get('Content-Type');
    if (ct) res.setHeader('Content-Type', ct);
    const cache = resp.headers.get('Cache-Control');
    if (cache) res.setHeader('Cache-Control', cache);
    const body = resp.body;
    if (body) Readable.fromWeb(body).pipe(res);
    else res.end();
  } catch (err) {
    console.error('mapbox-proxy error', err);
    res.status(502).json({ error: 'Proxy failed' });
  }
});

const YAHOO_CHART_ORIGIN = 'https://query1.finance.yahoo.com';

// GET /yahoo-chart?symbol=...&interval=...&range=... – proxy Yahoo Finance chart API (avoids CORS, keeps key server-side)
app.get('/yahoo-chart', async (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol || typeof symbol !== 'string' || !/^[A-Z0-9.-]+$/i.test(symbol.trim())) {
    return res.status(400).json({ error: 'Missing or invalid symbol' });
  }
  const interval = (req.query.interval && String(req.query.interval)) || '1d';
  const range = (req.query.range && String(req.query.range)) || '3mo';
  const url = `${YAHOO_CHART_ORIGIN}/v8/finance/chart/${encodeURIComponent(symbol.trim())}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ErmapStockChart/1.0)',
        Accept: 'application/json',
      },
    });
    if (!resp.ok) {
      res.status(resp.status).end();
      return;
    }
    const json = await resp.json();
    res.setHeader('Content-Type', 'application/json');
    res.json(json);
  } catch (err) {
    console.error('yahoo-chart proxy error', err);
    res.status(502).json({ error: 'Chart proxy failed' });
  }
});

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.once('end', () => resolve(Buffer.concat(chunks)));
    stream.once('error', reject);
  });
}

/** Load full GeoJSON by key (R2 or local fallback). Returns Promise<object>. */
async function getGeoJSONByKey(key) {
  const decoded = decodeURIComponent(key);
  const r2Key = decoded.startsWith(`${bucket}/`) ? decoded.slice(bucket.length + 1) : decoded;
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: r2Key }));
    if (!out.Body) throw new Error('No body');
    const stream = out.Body instanceof Readable ? out.Body : Readable.from(out.Body);
    const buf = await streamToBuffer(stream);
    return JSON.parse(buf.toString('utf8'));
  } catch (err) {
    if (err.name !== 'NoSuchKey' && err.code !== 'NoSuchKey') throw err;
    const localRelative = keyToLocalPath[r2Key] ?? keyToLocalPath[r2Key.replace(/^[^/]+\//, '')];
    if (!localRelative) throw new Error('Not found');
    const localPath = path.resolve(projectRoot, 'public', localRelative);
    if (!existsSync(localPath)) throw new Error('Not found');
    const buf = readFileSync(localPath, 'utf8');
    return JSON.parse(buf);
  }
}

/** Get or create cached { geojson, tileIndex } for key. */
async function getOrCreateTileIndex(key) {
  let entry = tileCache.get(key);
  if (entry) return entry;
  const geojson = await getGeoJSONByKey(key);
  const tileIndex = geojsonvt(geojson, {
    maxZoom: 14,
    tolerance: 3,
    extent: TILE_EXTENT,
    buffer: 64,
    indexMaxZoom: 6,
    indexMaxPoints: 0,
  });
  entry = { geojson, tileIndex };
  tileCache.set(key, entry);
  return entry;
}

// GET /tiles/bounds?key=... – returns { bbox: [west, south, east, north], featureCount }
app.get('/tiles/bounds', async (req, res) => {
  const key = req.query.key;
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'Missing key' });
  try {
    const { geojson } = await getOrCreateTileIndex(key);
    const bbox = getBoundsFromGeoJSON(geojson);
    const featureCount = geojson.features?.length ?? 0;
    if (!bbox) return res.status(200).json({ bbox: null, featureCount });
    const [west, south] = bbox[0];
    const [east, north] = bbox[1];
    res.json({ bbox: [west, south, east, north], featureCount });
  } catch (err) {
    if (err.message === 'Not found') return res.status(404).json({ error: 'Not found' });
    console.error('tiles/bounds error', err);
    res.status(500).json({ error: 'Failed to get bounds', details: err.message });
  }
});

// GET /tiles/view?key=...&west=&south=&east=&north=&zoom= – returns GeoJSON FeatureCollection for viewport
app.get('/tiles/view', async (req, res) => {
  const key = req.query.key;
  const west = Number(req.query.west);
  const south = Number(req.query.south);
  const east = Number(req.query.east);
  const north = Number(req.query.north);
  const zoom = Math.min(14, Math.max(0, Math.floor(Number(req.query.zoom) || 0)));
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'Missing key' });
  if (!Number.isFinite(west) || !Number.isFinite(south) || !Number.isFinite(east) || !Number.isFinite(north)) {
    return res.status(400).json({ error: 'Invalid bbox' });
  }
  try {
    const { tileIndex } = await getOrCreateTileIndex(key);
    const bounds = [[west, south], [east, north]];
    const tiles = getTilesInBounds(bounds, zoom);
    const features = [];
    const seen = new Set();
    let colorIdx = 0;
    for (const t of tiles) {
      const tileData = tileIndex.getTile(t.z, t.x, t.y);
      if (!tileData?.features) continue;
      for (const f of tileData.features) {
        const feat = tileFeatureToGeoJSON(t, f, TILE_EXTENT);
        const keyStr = JSON.stringify(feat.geometry?.type) + JSON.stringify(feat.geometry);
        if (seen.has(keyStr)) continue;
        seen.add(keyStr);
        if (feat.geometry?.type === 'Polygon' || feat.geometry?.type === 'MultiPolygon') {
          feat.properties._color = FILL_COLORS[colorIdx % FILL_COLORS.length];
          colorIdx++;
        }
        features.push(feat);
      }
    }
    res.setHeader('Content-Type', 'application/geo+json');
    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    if (err.message === 'Not found') return res.status(404).json({ error: 'Not found' });
    console.error('tiles/view error', err);
    res.status(500).json({ error: 'Failed to get view', details: err.message });
  }
});

// Paths without /api prefix – Vite mounts this app at /api, so full URLs are /api/upload, /api/files/...
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file in request; use field name "file"' });
  }
  const key = (req.body?.key && String(req.body.key).trim()) || `uploads/${req.file.originalname}`;
  const normalizedKey = key.replace(/^\/+/, '');

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: normalizedKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || 'application/octet-stream',
      })
    );
    res.json({
      key: normalizedKey,
      url: `/api/files/${normalizedKey}`, // same-origin when API is mounted on Vite at /api
      size: req.file.size,
      contentType: req.file.mimetype,
    });
  } catch (err) {
    console.error('R2 upload error:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// GET /files/:key – stream file from R2. Key may be full path "bucket/key" or relative "key"
app.get(/^\/files\/(.+)$/, async (req, res) => {
  const pathKey = (req.params && (req.params[0] ?? req.params.key)) || (req.url && req.url.replace(/^\/files\/?/, ''));
  if (!pathKey) return res.status(400).json({ error: 'Missing key' });
  const decoded = decodeURIComponent(pathKey);
  const key = decoded.startsWith(`${bucket}/`) ? decoded.slice(bucket.length + 1) : decoded;

  try {
    const out = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    if (!out.Body) return res.status(404).json({ error: 'Not found' });

    const contentType = out.ContentType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    if (out.ContentLength) res.setHeader('Content-Length', out.ContentLength);

    const stream = out.Body instanceof Readable ? out.Body : Readable.from(out.Body);
    stream.pipe(res);
  } catch (err) {
    if (err.name !== 'NoSuchKey') {
      console.error('R2 get error:', err);
      return res.status(500).json({ error: 'Failed to get file', details: err.message });
    }
    const localRelative = keyToLocalPath[key] ?? keyToLocalPath[key.replace(/^[^/]+\//, '')];
    if (!localRelative) return res.status(404).json({ error: 'Not found' });
    const localPath = path.resolve(projectRoot, 'public', localRelative);
    if (!existsSync(localPath)) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', 'application/geo+json');
    createReadStream(localPath).pipe(res);
  }
});

export { app };

const isRunDirectly = process.argv[1]?.endsWith('server/index.js');
if (isRunDirectly) {
  app.listen(PORT, () => {
    console.log(`Upload API running at http://localhost:${PORT}`);
  });
}
