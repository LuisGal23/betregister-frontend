export type Period = 'day' | 'week' | 'month' | 'last7' | 'last30' | 'ytd' | 'all';
export function periodBounds(period: Period, anchor: string): [number, number] {
  if (period === 'all') return [-Infinity, Infinity];
  const start = new Date(anchor + 'T00:00:00');
  if (period === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (period === 'month') start.setDate(1);
  if (['last7', 'last30', 'ytd'].includes(period)) {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    if (period === 'ytd') start.setMonth(0, 1);
    else start.setDate(start.getDate() - (period === 'last7' ? 6 : 29));
    return [start.getTime(), end.getTime()];
  }
  const end = new Date(start);
  if (period === 'month') end.setMonth(end.getMonth() + 1);
  else end.setDate(end.getDate() + (period === 'week' ? 7 : 1));
  return [start.getTime(), end.getTime()];
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
