import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, cloudStore] = await Promise.all([
  readFile(new URL('../src/app.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../src/cloud-store.mjs', import.meta.url), 'utf8'),
]);

test('histórico oferece editar, anexar foto e excluir cada marcação individualmente', () => {
  assert.match(app, /data-edit-punch=/);
  assert.match(app, /data-delete-punch=/);
  assert.match(app, /data-action="save-edit-punch"/);
  assert.match(app, /data-action="confirm-delete-punch"/);
  assert.match(app, /edit-photo-input/);
});

test('edição sincroniza a marcação e a foto, e exclusão remove dados remotos e locais', () => {
  assert.match(app, /cloudStore\.savePunch\(punch/);
  assert.match(app, /cloudStore\.deletePunches\(\[punch\]\)/);
  assert.match(app, /deletePunchPhotos\(\[punch\.photoId\]\)/);
});
