import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, app] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/app.mjs', import.meta.url), 'utf8'),
]);

test('botão principal abre inclusão com tipo selecionável e opções de batida', () => {
  assert.match(app, /textContent='Incluir batida'/);
  assert.match(app, /<select id="manual-kind">\$\{kindOptions\}<\/select>/);
  assert.match(app, /Incluir batida<\/button>/);
  assert.match(html, /id="punch-button"/);
  for (const type of ['clock_in', 'break_start', 'break_end', 'clock_out']) {
    assert.ok(app.includes(`${type}:`), `tipo de batida ausente: ${type}`);
  }
});
