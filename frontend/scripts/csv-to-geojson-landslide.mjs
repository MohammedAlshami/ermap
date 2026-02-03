/**
 * Converts Global Landslide Catalog Export CSV to GeoJSON (Point features).
 * Usage: node scripts/csv-to-geojson-landslide.mjs [input.csv] [output.geojson]
 * Default input: C:\Users\USER\Downloads\archive\Global_Landslide_Catalog_Export.csv
 * Default output: public/data/malaysia/geojson/global_landslide_catalog.geojson
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const defaultInput = path.join(root, 'Global_Landslide_Catalog_Export.csv');
const defaultOutput = path.join(root, 'public', 'data', 'malaysia', 'geojson', 'global_landslide_catalog.geojson');

function parseCSVLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      fields.push(field.trim());
      field = '';
    } else {
      field += c;
    }
  }
  fields.push(field.trim());
  return fields;
}

function main() {
  const inputPath = process.argv[2] || defaultInput;
  const outputPath = process.argv[3] || defaultOutput;

  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    console.error('Usage: node scripts/csv-to-geojson-landslide.mjs [input.csv] [output.geojson]');
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const header = parseCSVLine(lines[0]);
  const lonIdx = header.indexOf('longitude');
  const latIdx = header.indexOf('latitude');
  if (lonIdx === -1 || latIdx === -1) {
    console.error('CSV must have longitude and latitude columns.');
    process.exit(1);
  }

  const features = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < header.length) continue;
    const lon = parseFloat(fields[lonIdx]);
    const lat = parseFloat(fields[latIdx]);
    if (Number.isNaN(lon) || Number.isNaN(lat)) continue;
    const properties = {};
    header.forEach((key, j) => {
      if (key === 'longitude' || key === 'latitude') return;
      const val = fields[j];
      if (val === '' || val === undefined) {
        properties[key] = null;
        return;
      }
      const num = Number(val);
      properties[key] = Number.isNaN(num) ? val : num;
    });
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties,
    });
  }

  const geojson = {
    type: 'FeatureCollection',
    features,
  };

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 0), 'utf-8');
  console.log('Wrote', features.length, 'features to', outputPath);
}

main();
