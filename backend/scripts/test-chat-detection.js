/**
 * Test chat flow with building detection (same payload as frontend).
 * Detection runs inside the chat agent; no separate call to /api/detect-in-area.
 *
 * Run from backend folder:
 *   node scripts/test-chat-detection.js
 *
 * Requires: backend running (npm run start on port 3010).
 * Optional: set MAPBOX_ACCESS_TOKEN or VITE_MAPBOX_TOKEN in .env.local (or env) for satellite image.
 */
const fs = require('fs');
const path = require('path');
function loadEnvLocal() {
  const p = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}
loadEnvLocal();

const BASE = process.env.BACKEND_URL || 'http://localhost:3010';
const MAPBOX_TOKEN =
  process.env.MAPBOX_ACCESS_TOKEN ||
  process.env.VITE_MAPBOX_TOKEN ||
  '';

const payload = {
  message: 'help me detect the buildings here',
  session_id: '6ea88081-da44-4f68-9231-380192880da8',
  slides: [],
  selected_layer_ids: [],
  drawn_polygons_geojson: {
    type: 'FeatureCollection',
    features: [
      {
        id: 'iv2tgh569c6u4adBjUgAZfSGHJRvwvaI',
        type: 'Feature',
        properties: {},
        geometry: {
          coordinates: [
            [
              [-81.53452427400126, 27.73993657405127],
              [-81.53323487459326, 27.739970878903065],
              [-81.5332736340948, 27.73876334161355],
              [-81.53453719383525, 27.738781637732984],
              [-81.53452427400126, 27.73993657405127],
            ],
          ],
          type: 'Polygon',
        },
      },
    ],
  },
  mapbox_access_token: MAPBOX_TOKEN || undefined,
};

async function main() {
  console.log('POST', BASE + '/api/chat');
  console.log('Payload: message + 1 drawn polygon, mapbox_access_token:', MAPBOX_TOKEN ? 'set' : 'not set');
  console.log('');

  const res = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error('HTTP', res.status, res.statusText);
    console.error(await res.text());
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let seenDetectionResult = false;
  let seenError = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const t = parsed?.type;
        if (t === 'content' && parsed?.delta) process.stdout.write(parsed.delta);
        if (t === 'detection_result') {
          seenDetectionResult = true;
          console.log('\n[detection_result] bbox:', parsed.bbox);
          if (parsed.buildings) {
            const keys = Object.keys(parsed.buildings);
            console.log('  buildings keys:', keys);
            if (parsed.buildings.geojson) console.log('  buildings: geojson features', parsed.buildings.geojson.features?.length ?? 0);
            if (keys.some((k) => k !== 'geojson')) console.warn('  WARN: buildings should only have geojson, got:', keys);
          }
          if (parsed.trees) {
            const keys = Object.keys(parsed.trees);
            console.log('  trees keys:', keys);
            if (parsed.trees.geojson) console.log('  trees: geojson features', parsed.trees.geojson.features?.length ?? 0);
            if (keys.some((k) => k !== 'geojson')) console.warn('  WARN: trees should only have geojson, got:', keys);
          }
        }
        if (t === 'error') {
          seenError = true;
          console.error('\n[error]', parsed?.error?.message ?? parsed);
        }
        if (t === 'done') {
          console.log('\n[done] session_id:', parsed?.session_id);
        }
      } catch (_) {}
    }
  }

  if (seenError) {
    console.error('\nTest finished with error.');
    process.exit(1);
  }
  if (seenDetectionResult) {
    console.log('\nTest passed: detection ran as part of chat and returned detection_result.');
  } else {
    console.log('\nNo detection_result in stream (agent may not have called detect_in_drawn_area or detection failed).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
