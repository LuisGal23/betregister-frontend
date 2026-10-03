export interface ProfitEvent { id: number; time: number; profit: number; label: string }
export interface EventPoint { id: string; date: string; time: number; value: number; change: number; label: string; event: boolean }

/** Keep every realized result, including opposite results in the same second. */
export function eventSeries(events: ProfitEvent[], start: number, end: number): EventPoint[] {
  if (end < start) return [];
  let value = 0;
  const point = (id: string, time: number, change: number, label: string, event: boolean): EventPoint =>
    ({ id, time, date: new Date(time).toISOString(), value, change, label, event });
  const result = [point('start', start, 0, 'Inicio del periodo', false)];
  for (const e of [...events].sort((a,b) => a.time-b.time || a.id-b.id)) {
    if (e.time < start || e.time > end) continue;
    // A horizontal segment means no result yet; the change occurs at settlement time.
    result.push(point(`before-${e.id}`, e.time, 0, '', false));
    value += e.profit;
    result.push(point(`event-${e.id}`, e.time, e.profit, e.label, true));
  }
  result.push(point('end', end, 0, 'Último saldo de ganancias', false));
  return result;
}
