import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, app, icons] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/app.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../src/icons.mjs', import.meta.url), 'utf8').catch(() => ''),
]);

const platformDependentGlyphs = [0x2699, 0x2733, 0x25c7, 0x2302, 0x25a4, 0x25f7];

test('usa SVGs para ícones da interface em vez de glifos dependentes da plataforma', () => {
  assert.match(html, /<svg class="ui-icon"/);
  assert.match(app, /from '\.\/icons\.mjs'/);
  assert.match(icons, /<svg class="\$\{className\}"/);
  for (const codePoint of platformDependentGlyphs) {
    const glyph = String.fromCodePoint(codePoint);
    assert.equal(html.includes(glyph) || app.includes(glyph), false, `glifo inesperado: ${glyph}`);
  }
});
