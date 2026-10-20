import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, app] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/app.mjs', import.meta.url), 'utf8'),
]);

test('jornada diária pode ser digitada em campo de horas e minutos', () => {
  assert.match(html, /<input[^>]+id="settings-target"[^>]+type="time"/);
  assert.match(app, /settings-target.*addEventListener\('change'/s);
  assert.match(app, /const minutes=Number\(match\[1\]\)\*60\+Number\(match\[2\]\)/);
});

test('meta digitada respeita limites e sincroniza com estado e nuvem', () => {
  assert.match(app, /Math\.max\(60,Math\.min\(960/);
  assert.match(app, /saveCloudSettings\(\)/);
});
