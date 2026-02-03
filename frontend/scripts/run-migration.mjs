#!/usr/bin/env node
/**
 * Run all migrations in supabase/migrations/ in order (by filename).
 * Requires: DATABASE_URL in .env.local (postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres)
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
config({ path: join(projectRoot, '.env.local') });
config({ path: join(projectRoot, '.env') });

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env.local');
  process.exit(1);
}

const migrationsDir = join(projectRoot, 'supabase', 'migrations');
if (!existsSync(migrationsDir)) {
  console.error('Migrations dir not found:', migrationsDir);
  process.exit(1);
}

const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

async function main() {
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    for (const file of files) {
      const sqlPath = join(migrationsDir, file);
      const sql = readFileSync(sqlPath, 'utf8');
      await client.query(sql);
      console.log('Ran', file);
    }
    console.log('All migrations completed.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
