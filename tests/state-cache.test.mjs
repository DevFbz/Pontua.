import test from 'node:test';
import assert from 'node:assert/strict';
import { stateKeyForUser } from '../src/state-cache.mjs';

test('mantém o cache local separado por conta autenticada', () => {
  const first = stateKeyForUser('user-a');
  const second = stateKeyForUser('user-b');
  assert.notEqual(first, second);
  assert.match(first, /user-a$/);
  assert.match(second, /user-b$/);
});

test('rejeita identificadores de usuário que poderiam escapar da chave de cache', () => {
  assert.throws(() => stateKeyForUser(''), /usuário autenticado/);
  assert.throws(() => stateKeyForUser('../other'), /usuário autenticado/);
});
