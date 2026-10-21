const FIXED_HOLIDAYS = [
  ['01-01', 'Confraternização Universal'],
  ['04-21', 'Tiradentes'],
  ['05-01', 'Dia Mundial do Trabalho'],
  ['09-07', 'Independência do Brasil'],
  ['10-12', 'Nossa Senhora Aparecida'],
  ['11-02', 'Finados'],
  ['11-15', 'Proclamação da República'],
  ['11-20', 'Dia Nacional de Zumbi e da Consciência Negra'],
  ['12-25', 'Natal'],
];

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function dateKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function getHolidaysForMonth(year, monthIndex) {
  const holidays = new Map();
  for (const [monthDay, name] of FIXED_HOLIDAYS) {
    const key = `${year}-${monthDay}`;
    if (Number(monthDay.slice(0, 2)) === monthIndex + 1) holidays.set(key, name);
  }

  const goodFriday = easterSunday(year);
  goodFriday.setUTCDate(goodFriday.getUTCDate() - 2);
  const goodFridayKey = dateKey(goodFriday);
  if (goodFriday.getUTCMonth() === monthIndex) holidays.set(goodFridayKey, 'Paixão de Cristo');

  if (monthIndex === 9) {
    const firstDay = new Date(Date.UTC(year, 9, 1));
    const firstMonday = 1 + ((8 - firstDay.getUTCDay()) % 7);
    const thirdMonday = new Date(Date.UTC(year, 9, firstMonday + 14));
    holidays.set(dateKey(thirdMonday), 'Dia do Comerciário');
  }
  return holidays;
}

export function getHolidayForDate(dateText) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText || '');
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) return null;
  return getHolidaysForMonth(year, monthIndex).get(dateText) || null;
}
