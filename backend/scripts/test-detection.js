/**
 * Test building and tree detection endpoints.
 * Run from backend folder: node scripts/test-detection.js
 * Requires backend running (e.g. npm run start).
 */
const BASE = process.env.BACKEND_URL || 'http://localhost:3011';
// Minimal 1x1 PNG (backend resizes to 256x256)
const MINI_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function postImage(endpoint, fieldName) {
  const form = new FormData();
  form.append(fieldName, new Blob([MINI_PNG], { type: 'image/png' }), 'test.png');
  const res = await fetch(BASE + endpoint, {
    method: 'POST',
    body: form,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { status: res.status, data, raw: text };
}

async function main() {
  console.log('Testing detection endpoints (backend at', BASE, ')...\n');

  for (const [label, endpoint] of [
    ['POST /api/buildings/detect', '/api/buildings/detect'],
    ['POST /api/trees/detect', '/api/trees/detect'],
  ]) {
    console.log(label);
    try {
      const res = await postImage(endpoint, 'image');
      console.log('  Status:', res.status);
      if (res.data) {
        console.log('  mask length:', res.data.mask?.length ?? 'n/a');
        console.log('  width:', res.data.width, 'height:', res.data.height);
        console.log('  overlayBase64 length:', res.data.overlayBase64?.length ?? 0);
      } else {
        console.log('  Response:', (res.raw || '').slice(0, 300));
      }
    } catch (e) {
      console.log('  Error:', e.message);
    }
    console.log('');
  }
  console.log('Done.');
}

main();
