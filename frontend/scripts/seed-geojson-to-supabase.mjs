#!/usr/bin/env node
/**
 * Seed GeoJSON into Supabase from local public/ files or running API (R2).
 * Reads public/data-mapping.json for id, name, format, and full metadata.
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env (e.g. .env.local).
 * Optional: UPLOAD_API_BASE=http://localhost:3001 to fetch datasets that are only on R2.
 *
 * Run from frontend: node scripts/seed-geojson-to-supabase.mjs  (or npm run seed:geojson)
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
config({ path: join(projectRoot, '.env.local') });
config({ path: join(projectRoot, '.env') });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const apiBase = (process.env.UPLOAD_API_BASE || process.env.SEARCH_DATA_BASE_URL || 'http://localhost:3001').replace(/\/+$/, '');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set in .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/** Slug -> relative path under public/ for local GeoJSON files. */
const slugToLocalPath = {
  malaysia: 'data/malaysia/geojson/malaysia.geojson',
  malaysia_district: 'data/malaysia/geojson/malaysia.district.geojson',
  global_landslide_catalog: 'data/malaysia/geojson/global_landslide_catalog.geojson',
  sabah_hotels: 'data/malaysia/hotels/sabah_hotels.geojson',
  sabah_speedmart: 'data/malaysia/speedmart/sabah_speedmart.geojson',
};

/** Slug -> R2 key for fetching from running API when not in slugToLocalPath. */
const slugToR2Key = {
  education_centers_malaysia: 'ermap/uploads/Education_Centers_Malaysia.geojson',
  family_mart: 'uploads/family_mart.geojson',
  power_data: 'uploads/Power_data.geojson',
};

/** Collect all GeoJSON entries with slug from data-mapping (geojson, hotels, speedmart). */
function collectGeoJSONEntries(mapping) {
  const entries = [];
  if (!mapping?.malaysia) return entries;
  const sections = [
    mapping.malaysia.geojson,
    mapping.malaysia.hotels,
    mapping.malaysia.speedmart,
  ].filter(Boolean);
  for (const section of sections) {
    for (const [key, value] of Object.entries(section)) {
      if (value?.slug && value?.format === 'GeoJSON') {
        entries.push({
          slug: value.slug,
          id: value.id || null,
          name: value.name || key,
          format: value.format,
          metadata: value.metadata ?? null,
        });
      }
    }
  }
  return entries;
}

async function loadGeoJSON(slug) {
  const localRelative = slugToLocalPath[slug];
  if (localRelative) {
    const fullPath = join(projectRoot, 'public', localRelative);
    if (existsSync(fullPath)) {
      const raw = readFileSync(fullPath, 'utf8');
      return JSON.parse(raw);
    }
  }
  const r2Key = slugToR2Key[slug];
  if (r2Key) {
    try {
      const res = await fetch(`${apiBase}/api/files/${r2Key}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn(`Fetch ${slug} from API failed:`, e.message);
    }
  }
  return null;
}

async function main() {
  const dataMappingPath = join(projectRoot, 'public', 'data-mapping.json');
  if (!existsSync(dataMappingPath)) {
    console.error('public/data-mapping.json not found.');
    process.exit(1);
  }
  const mapping = JSON.parse(readFileSync(dataMappingPath, 'utf8'));
  const entries = collectGeoJSONEntries(mapping);
  if (entries.length === 0) {
    console.warn('No GeoJSON entries with slug found in data-mapping.json.');
    return;
  }

  for (const entry of entries) {
    const content = await loadGeoJSON(entry.slug);
    if (!content || (content.type !== 'FeatureCollection' && !Array.isArray(content?.features))) {
      console.warn(`Skipping ${entry.slug}: no GeoJSON content (add local file or run app and use UPLOAD_API_BASE)`);
      continue;
    }
    const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entry.id);
    const row = {
      ...(validUuid && { id: entry.id }),
      slug: entry.slug,
      name: entry.name,
      format: entry.format,
      metadata: entry.metadata,
      content,
    };
    const { error } = await supabase.from('geojson_datasets').upsert(row, { onConflict: 'slug' });
    if (error) {
      console.error(`Upsert ${entry.slug} failed:`, error.message);
    } else {
      console.log(`Upserted ${entry.slug} (${content.features?.length ?? 0} features, full metadata)`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
