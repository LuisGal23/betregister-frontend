/** Binary win/loss model. Probability is a user estimate, never inferred from odds/history. */
export function fractionalKelly(bankMinor: number, decimalOdds: number | null, probabilityPercent: number | null, fraction: number) {
  if (!Number.isSafeInteger(bankMinor) || bankMinor < 0 || decimalOdds === null || !Number.isFinite(decimalOdds) || decimalOdds <= 1 || probabilityPercent === null || !Number.isFinite(probabilityPercent) || probabilityPercent < 0 || probabilityPercent > 100 || ![0.25,0.5].includes(fraction)) return null;
  const p=probabilityPercent/100;
  const edge=p*decimalOdds-1;
  const full=Math.max(0,Math.min(1,edge/(decimalOdds-1)));
  const allocation=full*fraction;
  // Tiny epsilon only neutralizes floating-point noise at an exact cent boundary.
  const amountMinor=Math.min(bankMinor,Math.floor(bankMinor*allocation+1e-8));
  return {full,allocation,amountMinor,edge,breakEvenPercent:100/decimalOdds};
}
