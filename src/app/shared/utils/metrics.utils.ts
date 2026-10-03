export interface MetricEntry {
  amount: number;
  profit: number;
  cost: number;
  kind: string;
  created: string;
  id: number;
}
export function calculateMetrics(
  entries: MetricEntry[],
  closed: { profit: number; date: string; id: number }[],
) {
  const profit = entries.reduce((s, e) => s + e.profit, 0),
    cost = entries.reduce((s, e) => s + e.cost, 0),
    deposits = entries.filter((e) => e.kind === 'deposit').reduce((s, e) => s + e.amount, 0);
  let value = 0,
    peak = 0,
    maxDrawdown = 0,
    streak = 0,
    maxLossStreak = 0;
  let lossesSince: string | null = null;
  for (const e of [...entries].sort((a, b) => a.created.localeCompare(b.created) || a.id - b.id)) {
    value += e.profit;
    if (value >= peak) {
      peak = value;
      lossesSince = null;
    } else if (lossesSince === null) lossesSince = e.created;
    maxDrawdown = Math.max(maxDrawdown, peak - value);
  }
  for (const b of [...closed].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)) {
    streak = b.profit < 0 ? streak + 1 : 0;
    maxLossStreak = Math.max(maxLossStreak, streak);
  }
  return {
    profit,
    yield: cost > 0 ? (profit / cost) * 100 : null,
    roi: deposits > 0 ? (profit / deposits) * 100 : null,
    maxDrawdown,
    maxLossStreak,
    lossesSince,
  };
}
