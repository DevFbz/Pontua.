export const PUNCH_LABELS = {
  clock_in: 'Entrada',
  break_start: 'Início do intervalo',
  break_end: 'Fim do intervalo',
  clock_out: 'Saída',
};

export function createPunch(kind, date = new Date()) {
  if (!PUNCH_LABELS[kind]) throw new Error('Tipo de batida inválido');
  return { id: crypto.randomUUID(), kind, at: date.toISOString(), createdAt: new Date().toISOString() };
}

export function parseLocalDateTime(dateText, timeText) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText || '');
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeText || '');
  if (!dateMatch || !timeMatch) throw new Error('Data ou horário inválido');
  const [, year, month, day] = dateMatch.map(Number);
  const [, hour, minute] = timeMatch.map(Number);
  if (hour > 23 || minute > 59) throw new Error('Data ou horário inválido');
  const result = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) {
    throw new Error('Data ou horário inválido');
  }
  return result;
}

export function calculateDay(punches, targetMinutes = 480, holidayName = null) {
  const sorted = [...punches].sort((a, b) => new Date(a.at) - new Date(b.at));
  let workStart = null;
  let workedMinutes = 0;
  const warnings = [];
  for (const punch of sorted) {
    const time = new Date(punch.at).getTime();
    if (!Number.isFinite(time)) { warnings.push('Horário inválido'); continue; }
    if (punch.kind === 'clock_in' || punch.kind === 'break_end') {
      if (workStart !== null) warnings.push('Nova entrada antes de encerrar o período anterior');
      else workStart = time;
    } else if (punch.kind === 'break_start' || punch.kind === 'clock_out') {
      if (workStart === null) warnings.push('Saída sem entrada correspondente');
      else if (time < workStart) warnings.push('Horário fora de sequência');
      else { workedMinutes += Math.floor((time - workStart) / 60000); workStart = null; }
    }
  }
  const lastPunch = sorted.at(-1);
  const open = Boolean(lastPunch && lastPunch.kind !== 'clock_out');
  const creditedMinutes = holidayName && sorted.length === 0 ? targetMinutes : workedMinutes;
  return { workedMinutes: creditedMinutes, targetMinutes, balanceMinutes: creditedMinutes - targetMinutes, open, warnings, holidayName };
}

export function calculateBalance(days) {
  return days.reduce((sum, day) => sum + (Number(day.balanceMinutes) || 0), 0);
}

export function estimateDeparture(punches, targetMinutes = 480) {
  const sorted = [...punches].sort((a, b) => new Date(a.at) - new Date(b.at));
  let workStart = null;
  let breakStart = null;
  let workedMinutes = 0;
  let breakMinutes = 0;
  for (const punch of sorted) {
    const time = new Date(punch.at).getTime();
    if (!Number.isFinite(time)) continue;
    if (punch.kind === 'clock_in' || punch.kind === 'break_end') {
      if (punch.kind === 'break_end' && breakStart !== null && time >= breakStart) {
        breakMinutes += Math.floor((time - breakStart) / 60000);
        breakStart = null;
      }
      if (workStart === null) workStart = time;
    } else if (punch.kind === 'break_start' || punch.kind === 'clock_out') {
      if (workStart !== null && time >= workStart) {
        workedMinutes += Math.floor((time - workStart) / 60000);
        workStart = null;
      }
      if (punch.kind === 'break_start') breakStart = time;
    }
  }
  if (workStart === null) return null;
  const remainingWork = Math.max(0, targetMinutes - workedMinutes);
  const remainingBreak = Math.max(0, 60 - breakMinutes);
  return new Date(workStart + (remainingWork + remainingBreak) * 60000).toISOString();
}

export function formatDuration(value) {
  const n = Math.trunc(Number(value) || 0);
  const sign = n < 0 ? '-' : '+';
  const abs = Math.abs(n);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

export function formatClock(iso, timeZone = undefined) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(iso));
}
