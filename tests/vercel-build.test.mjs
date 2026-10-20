import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');

test('build gera somente os arquivos estáticos necessários para publicação', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], {
    cwd: root,
    env: { ...process.env, VITE_SUPABASE_URL: 'https://test.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_test' },
  });

  assert.deepEqual((await readdir(dist)).sort(), ['app.js', 'index.html', 'styles.css']);
  const html = await readFile(path.join(dist, 'index.html'), 'utf8');
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/app\.js"/);
  const bundle = await readFile(path.join(dist, 'app.js'), 'utf8');
  assert.match(bundle, /signInWithOtp/);
  assert.match(bundle, /https:\/\/test\.supabase\.co/);
  assert.match(bundle, /sb_publishable_test/);
});
