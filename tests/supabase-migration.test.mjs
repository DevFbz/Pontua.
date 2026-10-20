import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const migrationsDir = path.join(root, 'supabase', 'migrations');

async function migrationText() {
  const files = await readdir(migrationsDir);
  return Promise.all(files.filter(file => file.endsWith('.sql')).map(file => readFile(path.join(migrationsDir, file), 'utf8'))).then(files => files.join('\n'));
}

test('schema guarda marcações e preferências isoladas por usuário autenticado', async () => {
  const sql = await migrationText();
  assert.match(sql, /create table if not exists public\.punches/i);
  assert.match(sql, /create table if not exists public\.user_settings/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\).*user_id|user_id.*auth\.uid\(\)/is);
  assert.match(sql, /on delete cascade/i);
});

test('fotos ficam em bucket privado com políticas restritas à pasta do usuário', async () => {
  const sql = await migrationText();
  assert.match(sql, /insert into storage\.buckets[\s\S]*'receipts'[\s\S]*false/i);
  assert.match(sql, /storage\.foldername\(name\).*auth\.uid\(\)::text/is);
});
