import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, storage] = await Promise.all([
  readFile(new URL('../src/app.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../src/photo-storage.mjs', import.meta.url), 'utf8'),
]);

test('formulário de batida permite abrir a câmera traseira para o comprovante', () => {
  assert.match(app, /accept="image\/\*" capture="environment"/);
  assert.match(app, /data-action="choose-photo"/);
});

test('uma batida com foto mantém referência para abrir o comprovante depois', () => {
  assert.match(app, /putPunchPhoto/);
  assert.match(app, /data-view-photo/);
  assert.match(app, /getPunchPhoto/);
});

test('fotos são guardadas no IndexedDB e incluídas no backup JSON', () => {
  assert.match(storage, /indexedDB\.open/);
  assert.match(app, /receiptPhotos/);
  assert.match(app, /dataUrl:await blobToDataUrl/);
  assert.match(app, /deletePunchPhotos/);
});
