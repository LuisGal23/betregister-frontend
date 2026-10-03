export interface DailyPoint {
  date: string;
  value: number;
}

/** Pad missing calendar days; retain cumulative profit after a settlement. End is exclusive. */
export function fillDailySeries(
  points: DailyPoint[] | null,
  start: number,
  end: number,
): DailyPoint[] | null {
  if (points === null) return null;
  const values = new Map(points.map((p) => [p.date, p.value]));
  const result: DailyPoint[] = [];
  let value = 0;
  for (const day = new Date(start); day.getTime() < end; day.setDate(day.getDate() + 1)) {
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    value = values.get(date) ?? value;
    result.push({ date, value });
  }
  return result;
}
