import test from 'node:test';
import assert from 'node:assert/strict';
import { getHolidayForDate } from '../src/holidays.mjs';

test('reconhece feriados nacionais de data fixa e móvel em 2026', () => {
  assert.equal(getHolidayForDate('2026-01-01'), 'Confraternização Universal');
  assert.equal(getHolidayForDate('2026-04-03'), 'Paixão de Cristo');
  assert.equal(getHolidayForDate('2026-04-21'), 'Tiradentes');
  assert.equal(getHolidayForDate('2026-05-01'), 'Dia Mundial do Trabalho');
  assert.equal(getHolidayForDate('2026-09-07'), 'Independência do Brasil');
  assert.equal(getHolidayForDate('2026-10-12'), 'Nossa Senhora Aparecida');
  assert.equal(getHolidayForDate('2026-11-02'), 'Finados');
  assert.equal(getHolidayForDate('2026-11-15'), 'Proclamação da República');
  assert.equal(getHolidayForDate('2026-11-20'), 'Dia Nacional de Zumbi e da Consciência Negra');
  assert.equal(getHolidayForDate('2026-12-25'), 'Natal');
  assert.equal(getHolidayForDate('2026-06-04'), null);
  assert.equal(getHolidayForDate('2026-10-28'), null);
  assert.equal(getHolidayForDate('2027-03-26'), 'Paixão de Cristo');
});

test('reconhece o Dia do Comerciário na terceira segunda-feira de outubro', () => {
  assert.equal(getHolidayForDate('2026-10-19'), 'Dia do Comerciário');
  assert.equal(getHolidayForDate('2027-10-18'), 'Dia do Comerciário');
  assert.equal(getHolidayForDate('2026-10-12'), 'Nossa Senhora Aparecida');
  assert.equal(getHolidayForDate('2026-10-20'), null);
});
