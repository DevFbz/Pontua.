import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLocalDateTime } from '../src/domain.mjs';

test('converte a data e hora digitadas sem alterar o horário local', () => {
  const date = parseLocalDateTime('2026-10-18', '14:35');
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 9);
  assert.equal(date.getDate(), 18);
  assert.equal(date.getHours(), 14);
  assert.equal(date.getMinutes(), 35);
});

test('rejeita datas impossíveis em vez de normalizá-las', () => {
  assert.throws(() => parseLocalDateTime('2026-02-30', '08:00'), /inválid/);
});

test('rejeita horários fora do relógio de 24 horas', () => {
  assert.throws(() => parseLocalDateTime('2026-10-18', '25:90'), /inválid/);
});
