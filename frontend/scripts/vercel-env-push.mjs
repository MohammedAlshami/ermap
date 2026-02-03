#!/usr/bin/env node
/**
 * Push .env.local variables to Vercel (production).
 * Run: node scripts/vercel-env-push.mjs
 * Requires: vercel CLI linked and .env.local in project root.
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

if (!existsSync(envPath)) {
  console.error('.env.local not found');
  process.exit(1);
}

const raw = readFileSync(envPath, 'utf8');
const vars = [];
for (const line of raw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq <= 0) continue;
  const name = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (name) vars.push({ name, value });
}

if (vars.length === 0) {
  console.log('No variables found in .env.local');
  process.exit(0);
}

console.log(`Adding ${vars.length} env var(s) to Vercel production...`);
for (const { name, value } of vars) {
  const result = spawnSync('vercel', ['env', 'add', name, 'production', '--force'], {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
    cwd: root,
  });
  if (result.status !== 0) {
    console.error(`Failed to add ${name}`);
    process.exit(1);
  }
  console.log(`  ✓ ${name}`);
}
console.log('Done.');
