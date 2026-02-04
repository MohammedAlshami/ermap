/**
 * Test chat flow for add_slides (multiple slides in one call).
 *
 * Run from backend folder:
 *   node scripts/test-chat-slides.js
 *
 * Requires: backend running (e.g. npm run start, default port 3002).
 * Requires: OPENAI_API_KEY in .env or .env.local.
 */
const fs = require('fs');
const path = require('path');

function loadEnv(pathname) {
  if (!fs.existsSync(pathname)) return;
  const content = fs.readFileSync(pathname, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}
loadEnv(path.join(__dirname, '..', '.env'));
loadEnv(path.join(__dirname, '..', '.env.local'));

const BASE = process.env.BACKEND_URL || 'http://localhost:3002';

const payload = {
  message: 'Help me create 3 slides please using any data. First Malaysia districts, second education centers, third global landslide catalog.',
  slides: [],
  selected_layer_ids: [],
};

async function main() {
  console.log('POST', BASE + '/api/chat');
  console.log('Payload message:', payload.message);
  const res = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error('HTTP', res.status, await res.text());
    process.exit(1);
  }
  const reader = res.body && typeof res.body.getReader === 'function' ? res.body.getReader() : null;
  if (!reader) {
    console.error('No body or getReader');
    process.exit(1);
  }
  const decoder = new TextDecoder();
  let buffer = '';
  let slidesCount = 0;
  let doneSlidesCount = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6).trim());
        if (data.type === 'slides' && Array.isArray(data.slides)) {
          slidesCount = data.slides.length;
          console.log('\n[chunk type=slides] slides count:', slidesCount);
          data.slides.forEach((s, i) => console.log(`  ${i + 1}. ${s.title} (layers: ${(s.layerEntries || []).map((e) => e.layerId).join(', ')})`));
        }
        if (data.type === 'done') {
          if (Array.isArray(data.slides)) {
            doneSlidesCount = data.slides.length;
            console.log('\n[chunk type=done] slides count:', doneSlidesCount);
            data.slides.forEach((s, i) => console.log(`  ${i + 1}. ${s.title}`));
          }
        }
        if (data.type === 'error' && data.error?.message) {
          console.error('Error:', data.error.message);
        }
      } catch (_) {}
    }
  }
  console.log('\n--- Result ---');
  console.log('slides chunk count:', slidesCount);
  console.log('done chunk slides count:', doneSlidesCount);
  if (slidesCount >= 3 || doneSlidesCount >= 3) {
    console.log('OK: Backend returned 3+ slides.');
  } else {
    console.log('FAIL: Expected 3 slides. Agent may have used add_slide once instead of add_slides.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
