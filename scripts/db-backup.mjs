// Portable logical backup for the free-plan TrashTag project (no Docker / pg_dump
// required). Exports every public table to a timestamped SQL file of INSERTs.
//
// The schema itself lives in version-controlled migrations; this captures DATA.
// Restore assumes the schema (migrations) and auth.users already exist.
//
// Usage:
//   export SUPABASE_SERVICE_ROLE_KEY=...   # Dashboard > Settings > API > service_role (secret)
//   npm run db:backup
//
// The service-role key bypasses RLS — keep it out of the repo and CI logs.
import { readFileSync, mkdirSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))

const url = env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY (Dashboard > Settings > API > service_role).')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

// Restore-safe order (parents before children).
const TABLES = ['profiles', 'requests', 'posts', 'request_likes', 'post_likes', 'messages', 'collector_locations']

function lit(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (Array.isArray(v)) return `ARRAY[${v.map(lit).join(',')}]`
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`
  return `'${String(v).replace(/'/g, "''")}'`
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
mkdirSync(new URL('../backups/', import.meta.url), { recursive: true })
const outPath = new URL(`../backups/backup-${stamp}.sql`, import.meta.url)

let sql = `-- TrashTag logical backup ${new Date().toISOString()}\n-- Restore: psql <conn> -f this-file (schema + auth.users must exist first)\nbegin;\n`
let total = 0
for (const table of TABLES) {
  const { data, error } = await db.from(table).select('*')
  if (error) { console.error(`SKIP ${table}: ${error.message}`); continue }
  sql += `\n-- ${table} (${data.length} rows)\n`
  for (const row of data) {
    const cols = Object.keys(row)
    sql += `insert into public.${table} (${cols.join(', ')}) values (${cols.map((c) => lit(row[c])).join(', ')}) on conflict do nothing;\n`
  }
  total += data.length
  console.log(`  ${table}: ${data.length} rows`)
}
sql += '\ncommit;\n'

const { writeFileSync } = await import('node:fs')
writeFileSync(outPath, sql)
console.log(`Backup written: ${outPath.pathname} (${total} rows total)`)
