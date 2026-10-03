export type OddsFormat = 'decimal' | 'american';
export function decimalOdds(value: number | null, format: OddsFormat): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (format === 'decimal') return value > 1 && value <= 10000 ? value : null;
  if (!Number.isInteger(value) || Math.abs(value) < 100 || Math.abs(value) > 999900) return null;
  return Math.round((value > 0 ? 1 + value / 100 : 1 + 100 / -value) * 10000) / 10000;
}
/** Exact half-up return in minor units, without rounding repeating American odds first. */
export function americanPayout(stake: number, odds: number): number {
  const numerator = BigInt(stake) * BigInt(odds > 0 ? odds : 100);
  const denominator = BigInt(odds > 0 ? 100 : -odds);
  return stake + Number((numerator * 2n + denominator) / (denominator * 2n));
}
