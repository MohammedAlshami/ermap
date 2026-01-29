import { config } from 'dotenv';
import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Fallback: key -> path under public/ when R2 returns 404
const keyToLocalPath = {
  'uploads/malaysia.geojson': 'data/malaysia/geojson/malaysia.geojson',
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
    const localRelative = keyToLocalPath[key];
    if (!localRelative) return res.status(404).json({ error: 'Not found' });
    const localPath = path.join(projectRoot, 'public', localRelative);
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
