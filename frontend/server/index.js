import { config } from 'dotenv';
import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';
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

// Fallback: key -> path under public/ when R2 returns 404 (images/rasters are R2-only, never local)
const keyToLocalPath = {
  'uploads/malaysia.geojson': 'data/malaysia/geojson/malaysia.geojson',
  'ermap/uploads/malaysia.geojson': 'data/malaysia/geojson/malaysia.geojson',
};

// Load .env.local from project root (reliable when server runs as Vite middleware)
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

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

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/** GeoJSON datasets served from Supabase by slug. Keys here are used for GET /files/:key and getGeoJSONByKey. */
const GEOJSON_SLUGS = new Set([
  'malaysia',
  'education_centers_malaysia',
  'family_mart',
  'power_data',
  'global_landslide_catalog',
  'malaysia_district',
  'sabah_hotels',
  'sabah_speedmart',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || 'fallback-dev-secret';

/** Auth middleware: set req.user from Authorization Bearer token, or null. */
function authOptional(req, _res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded?.sub ?? decoded?.userId;
    if (userId) req.user = { id: userId, email: decoded.email, name: decoded.name };
    else req.user = null;
  } catch {
    req.user = null;
  }
  next();
}

/** Require auth; 401 if no user. */
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ---------- Auth routes (no auth required) ----------
app.post('/auth/register', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
  const { email, password, name } = req.body || {};
  const emailStr = typeof email === 'string' ? email.trim() : '';
  const passwordStr = typeof password === 'string' ? password : '';
  if (!emailStr || !passwordStr) return res.status(400).json({ error: 'Email and password required' });
  if (passwordStr.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const password_hash = await bcrypt.hash(passwordStr, 10);
    const { data, error } = await supabase.from('users').insert({ email: emailStr, password_hash, name: name?.trim() || null }).select('id, email, name').single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email already registered' });
      throw error;
    }
    const user = { id: data.id, email: data.email, name: data.name };
    const token = jwt.sign({ sub: data.id, email: data.email, name: data.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('auth/register error', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
  const { email, password } = req.body || {};
  const emailStr = typeof email === 'string' ? email.trim() : '';
  const passwordStr = typeof password === 'string' ? password : '';
  if (!emailStr || !passwordStr) return res.status(400).json({ error: 'Email and password required' });
  try {
    const { data, error } = await supabase.from('users').select('id, email, name, password_hash').eq('email', emailStr).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(passwordStr, data.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    const user = { id: data.id, email: data.email, name: data.name };
    const token = jwt.sign({ sub: data.id, email: data.email, name: data.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error('auth/login error', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/auth/me', authOptional, requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ---------- Projects (auth required for list/create/update/delete) ----------
app.get('/projects', authOptional, requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
  try {
    const { data, error } = await supabase.from('projects').select('id, name, description, share_id, created_at, updated_at').eq('user_id', req.user.id).order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('projects list error', err);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

app.post('/projects', authOptional, requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
  const { name, description, config } = req.body || {};
  const nameStr = typeof name === 'string' ? name.trim() : '';
  if (!nameStr) return res.status(400).json({ error: 'Name required' });
  const share_id = nanoid(12);
  try {
    const { data, error } = await supabase.from('projects').insert({
      user_id: req.user.id,
      name: nameStr,
      description: typeof description === 'string' ? description.trim() || null : null,
      config: config && typeof config === 'object' ? config : {},
      share_id,
    }).select('id, name, description, config, share_id, created_at, updated_at').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('projects create error', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/projects/public/:shareId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
  const shareId = req.params.shareId;
  if (!shareId) return res.status(404).json({ error: 'Not found' });
  try {
    const { data, error } = await supabase.from('projects').select('id, name, description, config').eq('share_id', shareId).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json({ name: data.name, description: data.description, config: data.config });
  } catch (err) {
    console.error('projects public error', err);
    res.status(500).json({ error: 'Failed to load' });
  }
});

app.get('/projects/:id', authOptional, requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from('projects').select('id, name, description, config, share_id, created_at, updated_at').eq('id', id).eq('user_id', req.user.id).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    console.error('projects get error', err);
    res.status(500).json({ error: 'Failed to load' });
  }
});

app.patch('/projects/:id', authOptional, requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
  const { id } = req.params;
  const { name, description, config } = req.body || {};
  try {
    const updates = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (description !== undefined) updates.description = typeof description === 'string' ? description.trim() || null : null;
    if (config && typeof config === 'object') updates.config = config;
    updates.updated_at = new Date().toISOString();
    if (Object.keys(updates).length <= 1) return res.status(400).json({ error: 'No updates' });
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).eq('user_id', req.user.id).select('id, name, description, config, share_id, created_at, updated_at').single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    console.error('projects patch error', err);
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.delete('/projects/:id', authOptional, requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
  const { id } = req.params;
  try {
    const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('projects delete error', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ---------- Data mapping and GeoJSON ----------
const dataMappingPath = path.join(projectRoot, 'public', 'data-mapping.json');

/** Flatten data-mapping.json into a list of entries { id, name, format, r2Key?, metadata?, bounds?, path }. */
function flattenDataMapping(obj, pathPrefix = []) {
  const entries = [];
  if (!obj || typeof obj !== 'object') return entries;
  for (const [key, value] of Object.entries(obj)) {
    const path = [...pathPrefix, key];
    const pathStr = path.join('.');
    if (value && typeof value === 'object' && (value.id || value.name) && (value.format || value.r2Key || value.tileLayer || value.slug)) {
      entries.push({
        id: value.id || value.name?.replace(/\s+/g, '_').toLowerCase(),
        name: value.name || key,
        format: value.format,
        r2Key: value.r2Key,
        slug: value.slug,
        tileLayer: value.tileLayer,
        metadata: value.metadata,
        bounds: value.bounds,
        path: pathStr,
      });
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenDataMapping(value, path));
    }
  }
  return entries;
}

function loadDataMapping() {
  if (!existsSync(dataMappingPath)) return null;
  const raw = readFileSync(dataMappingPath, 'utf8');
  return JSON.parse(raw);
}

// GET /api/search-data?q=... – search data-mapping by name, format, metadata.description (match any word)
app.get('/search-data', (req, res) => {
  const q = (req.query.q && String(req.query.q).trim()) || '';
  try {
    const data = loadDataMapping();
    if (!data) return res.status(200).json({ results: [] });
    const flat = flattenDataMapping(data);
    const lower = q.toLowerCase();
    const words = lower ? lower.split(/\s+/).filter((w) => w.length >= 2) : [];
    const results = flat.filter((e) => {
      if (!lower) return true;
      const name = (e.name || '').toLowerCase();
      const format = (e.format || '').toLowerCase();
      const desc = (e.metadata?.description || '').toLowerCase();
      const type = (e.metadata?.type || '').toLowerCase();
      const path = (e.path || '').toLowerCase();
      const combined = [name, format, desc, type, path].join(' ');
      const fullMatch = name.includes(lower) || format.includes(lower) || desc.includes(lower) || type.includes(lower) || path.includes(lower);
      if (fullMatch) return true;
      return words.some((word) => combined.includes(word));
    });
    res.setHeader('Content-Type', 'application/json');
    res.json({ results });
  } catch (err) {
    console.error('search-data error', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// GET /api/data-mapping – full data-mapping JSON (for backend to resolve raster by id)
app.get('/data-mapping', (req, res) => {
  try {
    const data = loadDataMapping();
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (err) {
    console.error('data-mapping error', err);
    res.status(500).json({ error: 'Failed to load', details: err.message });
  }
});

// GET /api/geojson-datasets – list GeoJSON datasets from Supabase (replaces data-mapping for Data page)
app.get('/geojson-datasets', async (_req, res) => {
  if (!supabase) {
    return res.status(200).json([]);
  }
  try {
    const { data, error } = await supabase
      .from('geojson_datasets')
      .select('id, slug, name, format, metadata, content');
    if (error) {
      console.error('geojson-datasets list error:', error);
      return res.status(500).json({ error: 'Failed to list', details: error.message });
    }
    const list = (data || []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      format: row.format,
      metadata: row.metadata,
      featureCount: row.content?.features?.length ?? null,
    }));
    res.setHeader('Content-Type', 'application/json');
    res.json(list);
  } catch (err) {
    console.error('geojson-datasets error', err);
    res.status(500).json({ error: 'Failed to list', details: err.message });
  }
});

// GET /api/geojson-datasets/:id – one GeoJSON dataset by id (for Data detail page)
app.get('/geojson-datasets/:id', async (req, res) => {
  const { id } = req.params;
  if (!supabase || !id) {
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const { data, error } = await supabase
      .from('geojson_datasets')
      .select('id, slug, name, format, metadata')
      .eq('id', id)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (err) {
    console.error('geojson-datasets/:id error', err);
    res.status(500).json({ error: 'Failed to load', details: err.message });
  }
});

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

/** Load full GeoJSON by key (Supabase slug, then R2 or local fallback). Returns Promise<object>. */
async function getGeoJSONByKey(key) {
  const decoded = decodeURIComponent(key);
  const slug = decoded.startsWith(`${bucket}/`) ? decoded.slice(bucket.length + 1) : decoded;

  if (supabase && GEOJSON_SLUGS.has(slug)) {
    const { data, error } = await supabase.from('geojson_datasets').select('content').eq('slug', slug).single();
    if (!error && data?.content) return data.content;
  }

  const r2Key = slug;
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
  const slug = req.body?.slug && String(req.body.slug).trim();
  const isGeoJSON =
    req.file.mimetype === 'application/geo+json' ||
    req.file.mimetype === 'application/json' ||
    (req.file.originalname && /\.(geojson|json)$/i.test(req.file.originalname));

  if (slug && supabase && isGeoJSON) {
    try {
      const content = JSON.parse(req.file.buffer.toString('utf8'));
      if (!content || (content.type !== 'FeatureCollection' && !Array.isArray(content.features))) {
        return res.status(400).json({ error: 'Invalid GeoJSON: expected FeatureCollection' });
      }
      const name = (req.body?.name && String(req.body.name).trim()) || slug;
      const format = 'GeoJSON';
      const metadata = req.body?.metadata ? (typeof req.body.metadata === 'object' ? req.body.metadata : JSON.parse(String(req.body.metadata))) : null;
      const { error } = await supabase.from('geojson_datasets').upsert(
        { slug, name, format, metadata, content },
        { onConflict: 'slug' }
      );
      if (error) {
        console.error('Supabase GeoJSON upload error:', error);
        return res.status(500).json({ error: 'Upload to DB failed', details: error.message });
      }
      return res.json({
        slug,
        url: `/api/files/${slug}`,
        size: req.file.size,
        contentType: 'application/geo+json',
      });
    } catch (err) {
      console.error('GeoJSON parse/upload error:', err);
      return res.status(400).json({ error: 'Invalid GeoJSON body', details: err.message });
    }
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

// GET /tiles/:layer/:z/:x/:y.:ext – serve XYZ raster tiles from R2 (e.g. oso-tiles/8/42/95.png)
app.get('/tiles/:layer/:z/:x/:y.:ext', async (req, res) => {
  const { layer, z, x, y, ext } = req.params;
  if (!layer || z == null || x == null || y == null || !ext) {
    return res.status(400).json({ error: 'Missing layer, z, x, y, or ext' });
  }
  const key = `${layer}-tiles/${z}/${x}/${y}.${ext}`;
  try {
    const out = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    if (!out.Body) return res.status(404).json({ error: 'Not found' });
    const contentType = ext.toLowerCase() === 'png' ? 'image/png' : ext.toLowerCase() === 'jpg' || ext.toLowerCase() === 'jpeg' ? 'image/jpeg' : 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    if (out.ContentLength) res.setHeader('Content-Length', out.ContentLength);
    const stream = out.Body instanceof Readable ? out.Body : Readable.from(out.Body);
    stream.pipe(res);
  } catch (err) {
    if (err.name === 'NoSuchKey') return res.status(404).json({ error: 'Not found' });
    console.error('R2 tiles get error:', err);
    res.status(500).json({ error: 'Failed to get tile' });
  }
});

// Content-Type from key/path (shared by R2 and local fallback)
function contentTypeFromKey(key) {
  const lower = (key || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.geojson') || lower.endsWith('.json')) return 'application/geo+json';
  return 'application/octet-stream';
}

// GET /files/:key – GeoJSON from Supabase by slug, else stream file from R2 (or local fallback)
app.get(/^\/files\/(.+)$/, async (req, res) => {
  const pathKey = (req.params && (req.params[0] ?? req.params.key)) || (req.url && req.url.replace(/^\/files\/?/, ''));
  if (!pathKey) return res.status(400).json({ error: 'Missing key' });
  const decoded = decodeURIComponent(pathKey);
  const key = decoded.startsWith(`${bucket}/`) ? decoded.slice(bucket.length + 1) : decoded;

  if (supabase && GEOJSON_SLUGS.has(key)) {
    const { data, error } = await supabase.from('geojson_datasets').select('content').eq('slug', key).single();
    if (!error && data?.content) {
      res.setHeader('Content-Type', 'application/geo+json');
      return res.json(data.content);
    }
  }

  try {
    const out = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    if (!out.Body) return res.status(404).json({ error: 'Not found' });

    let contentType = out.ContentType || contentTypeFromKey(key);
    const lower = key.toLowerCase();
    if (lower.endsWith('.png')) contentType = 'image/png';
    else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (lower.endsWith('.webp')) contentType = 'image/webp';
    res.setHeader('Content-Type', contentType);
    if (out.ContentLength) res.setHeader('Content-Length', out.ContentLength);
    console.log('[GET /files] R2 key=', key, 'Content-Type=', contentType, 'ContentLength=', out.ContentLength);

    const stream = out.Body instanceof Readable ? out.Body : Readable.from(out.Body);
    stream.pipe(res);
  } catch (err) {
    if (err.name !== 'NoSuchKey') {
      console.error('R2 get error:', err);
      return res.status(500).json({ error: 'Failed to get file', details: err.message });
    }
    const localRelative = keyToLocalPath[key] ?? keyToLocalPath[key.replace(/^[^/]+\//, '')];
    if (!localRelative) {
      console.log('[GET /files] NoSuchKey and no local fallback for key=', key);
      return res.status(404).json({ error: 'Not found' });
    }
    const localPath = path.resolve(projectRoot, 'public', localRelative);
    if (!existsSync(localPath)) return res.status(404).json({ error: 'Not found' });
    const contentType = contentTypeFromKey(localPath);
    res.setHeader('Content-Type', contentType);
    console.log('[GET /files] local key=', key, 'path=', localRelative, 'Content-Type=', contentType);
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
