import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDay, calculateBalance, formatDuration, createPunch } from '../src/domain.mjs';

test('calcula jornada normal descontando intervalo', () => {
  const day = calculateDay([
    { kind: 'clock_in', at: '2026-10-18T08:00:00.000Z' },
    { kind: 'break_start', at: '2026-10-18T12:00:00.000Z' },
    { kind: 'break_end', at: '2026-10-18T13:00:00.000Z' },
    { kind: 'clock_out', at: '2026-10-18T17:00:00.000Z' },
  ], 8 * 60);
  assert.equal(day.workedMinutes, 8 * 60);
  assert.equal(day.balanceMinutes, 0);
});

test('dia em andamento não inventa minutos após a última batida', () => {
  const day = calculateDay([
    { kind: 'clock_in', at: '2026-10-18T08:00:00.000Z' },
    { kind: 'break_start', at: '2026-10-18T12:00:00.000Z' },
  ], 8 * 60);
  assert.equal(day.workedMinutes, 4 * 60);
  assert.equal(day.open, true);
});

test('ignora par invertido sem produzir duração negativa', () => {
  const day = calculateDay([
    { kind: 'clock_out', at: '2026-10-18T08:00:00.000Z' },
  ], 8 * 60);
  assert.equal(day.workedMinutes, 0);
  assert.ok(day.warnings.length > 0);
});

test('calcula saldo acumulado em minutos', () => {
  assert.equal(calculateBalance([{ balanceMinutes: 60 }, { balanceMinutes: -30 }]), 30);
});

test('formata duração positiva e negativa', () => {
  assert.equal(formatDuration(125), '+02:05');
  assert.equal(formatDuration(-75), '-01:15');
});

test('cria uma batida com id, tipo e horário', () => {
  const punch = createPunch('clock_in', new Date('2026-10-18T11:00:00Z'));
  assert.equal(punch.kind, 'clock_in');
  assert.equal(punch.at, '2026-10-18T11:00:00.000Z');
  assert.equal(typeof punch.id, 'string');
});
