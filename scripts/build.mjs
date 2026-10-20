import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  cp(resolve(root, 'index.html'), resolve(output, 'index.html')),
  cp(resolve(root, 'styles.css'), resolve(output, 'styles.css')),
]);

const env = {};
for (const file of ['.vercel/.env.production.local', '.env.local']) {
  const contents = await readFile(resolve(root, file), 'utf8').catch(() => '');
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
const value = name => JSON.stringify(process.env[name] || env[name] || '');

await build({
  entryPoints: [resolve(root, 'src/app.mjs')],
  outfile: resolve(output, 'app.js'),
  bundle: true,
  format: 'esm',
  target: ['es2022'],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': value('VITE_SUPABASE_URL'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': value('VITE_SUPABASE_ANON_KEY'),
  },
});

console.log('Build estático concluído em dist/.');
