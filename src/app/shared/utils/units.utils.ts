export interface UnitConfig {
  mode: 'fixed' | 'percent';
  value: number | string;
  currency: 'MXN' | 'USD';
  dynamic: boolean;
  base?: Partial<Record<'MXN' | 'USD', number>>;
}
export function unitAmount(
  config: UnitConfig | null | undefined,
  currency: 'MXN' | 'USD',
  houses: { currency: string; balance: number; pending: number }[],
  rate: number | null,
): number | null {
  if (!config || !Number.isFinite(Number(config.value)) || Number(config.value) <= 0) return null;
  if (config.mode === 'fixed') {
    if (config.currency === currency) return Number(config.value);
    if (rate === null || !Number.isFinite(rate) || rate <= 0) return null;
    return config.currency === 'USD' ? Number(config.value) * rate : Number(config.value) / rate;
  }
  const base = config.dynamic
    ? houses.filter((h) => h.currency === currency).reduce((s, h) => s + h.balance + h.pending, 0)
    : (config.base?.[currency] ?? 0);
  return Math.round((base * Number(config.value)) / 100) / 100;
}
