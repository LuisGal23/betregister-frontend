import type { Bet } from '../../features/bets/models/bet.model';
import type { Currency } from '../models/currency.model';

/** Decimal odds multiply integer cents with the same half-up rounding as the API. */
export function winningPayout(stake: number, odds: string): number {
  const [whole, fraction = ''] = odds.split('.');
  const scale = 10n ** BigInt(fraction.length);
  const coefficient = BigInt(whole + fraction);
  return Number((BigInt(stake) * coefficient * 2n + scale) / (2n * scale));
}

/** Returns major units; unavailable conversions must never silently become 1:1. */
export function convertMoney(
  minor: number,
  source: Currency,
  target: Currency,
  usdMxn: number | null,
): number | null {
  if (source === target) return minor / 100;
  if (usdMxn === null || !Number.isFinite(usdMxn) || usdMxn <= 0) return null;
  return (minor / 100) * (source === 'USD' ? usdMxn : 1 / usdMxn);
}

export function profitSeries(
  bets: Bet[],
  currency: Currency,
  rate: number | null,
): { date: string; value: number }[] | null {
  const daily = new Map<string, number>();
  for (const bet of bets.filter((b) => b.status !== 'pending')) {
    const amount = convertMoney(bet.payout - bet.stake, bet.currency, currency, rate);
    if (amount === null) return null;
    const instant = new Date((bet.settled_at || bet.created).replace(' ', 'T') + 'Z');
    const date = `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, '0')}-${String(instant.getDate()).padStart(2, '0')}`;
    daily.set(date, (daily.get(date) ?? 0) + amount);
  }
  let cumulative = 0;
  return [...daily]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: (cumulative += value) }));
}

export function lineGeometry(values: number[]) {
  const points = [0, ...values];
  const min = Math.min(...points),
    max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((v, i) => ({
    x: 24 + (i / Math.max(points.length - 1, 1)) * 552,
    y: 180 - ((v - min) / span) * 144,
  }));
  return {
    path: coords.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
    area: `M24,210 ${coords.map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} L576,210 Z`,
    zero: 180 - ((0 - min) / span) * 144,
    min,
    max,
  };
}
