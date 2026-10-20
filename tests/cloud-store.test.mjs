import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRemotePunch, receiptObjectPath } from '../src/cloud-store.mjs';

test('converte uma marcação remota sem expor campos do banco à interface', () => {
  assert.deepEqual(mapRemotePunch({
    id: 'punch-1', kind: 'clock_in', at: '2026-10-20T08:00:00.000Z',
    manual: true, photo_path: 'user-1/punch-1', user_id: 'user-1', created_at: 'ignored',
  }), {
    id: 'punch-1', kind: 'clock_in', at: '2026-10-20T08:00:00.000Z',
    manual: true, photoId: 'punch-1', photoPath: 'user-1/punch-1',
  });
});

test('retorna nulo para marcações sem foto', () => {
  assert.deepEqual(mapRemotePunch({ id: 'punch-2', kind: 'clock_out', at: '2026-10-20T17:00:00.000Z', manual: false, photo_path: null }), {
    id: 'punch-2', kind: 'clock_out', at: '2026-10-20T17:00:00.000Z', manual: false,
    photoId: null, photoPath: null,
  });
});

test('armazena a foto em uma pasta exclusiva do usuário', () => {
  assert.equal(receiptObjectPath('user-1', 'punch-1'), 'user-1/punch-1');
  assert.throws(() => receiptObjectPath('', 'punch-1'), /usuário e marcação/);
  assert.throws(() => receiptObjectPath('user-1', '../other'), /usuário e marcação/);
});
