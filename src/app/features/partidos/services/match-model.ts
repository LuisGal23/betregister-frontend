import type { MatchModel, TeamFormMatch, TeamFormStats } from './sports.model';

/**
 * Modelo estadístico construido 100% con datos reales (últimos partidos de ESPN).
 * - Fútbol: Poisson bivariado independiente con goles a favor / en contra.
 * - NBA / NFL / MLB: aproximación Normal sobre puntos anotados / recibidos.
 */

const LEAGUE_AVG: Record<string, { pts: number; sd: number; homeAdv: number }> = {
  'Fútbol': { pts: 1.35, sd: 0, homeAdv: 0.12 },
  Baloncesto: { pts: 114, sd: 12.5, homeAdv: 2.2 },
  Americano: { pts: 22.5, sd: 13.5, homeAdv: 1.6 },
  'Béisbol': { pts: 4.4, sd: 3.1, homeAdv: 0.15 },
};

export function formStats(form: TeamFormMatch[] | undefined): TeamFormStats {
  const list = form ?? [];
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let gf = 0;
  let ga = 0;
  let counted = 0;
  for (const m of list) {
    if (m.result === 'W') wins++;
    else if (m.result === 'D') draws++;
    else losses++;
    if (typeof m.goalsFor === 'number' && typeof m.goalsAgainst === 'number') {
      gf += m.goalsFor;
      ga += m.goalsAgainst;
      counted++;
    }
  }
  return {
    games: list.length,
    wins,
    draws,
    losses,
    scoredAvg: counted ? round(gf / counted, 2) : 0,
    concededAvg: counted ? round(ga / counted, 2) : 0,
    points: wins * 3 + draws,
  };
}

function round(n: number, d = 1): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

function poisson(k: number, lambda: number): number {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / fact;
}

function normCdf(x: number): number {
  // Abramowitz-Stegun
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

export function buildMatchModel(
  sport: string,
  homeFormList: TeamFormMatch[] | undefined,
  awayFormList: TeamFormMatch[] | undefined,
  marketTotalLine?: number | null
): MatchModel {
  const cfg = LEAGUE_AVG[sport] ?? LEAGUE_AVG['Fútbol'];
  const homeForm = formStats(homeFormList);
  const awayForm = formStats(awayFormList);

  // Shrink small samples toward league average (evita extremos con 2-3 partidos)
  const shrink = (val: number, games: number) => {
    const w = Math.min(1, games / 8);
    return games ? val * w + cfg.pts * (1 - w) : cfg.pts;
  };
  const hAtt = shrink(homeForm.scoredAvg, homeForm.games);
  const hDef = shrink(homeForm.concededAvg, homeForm.games);
  const aAtt = shrink(awayForm.scoredAvg, awayForm.games);
  const aDef = shrink(awayForm.concededAvg, awayForm.games);

  const expectedHome = Math.max(0.15, (hAtt * aDef) / cfg.pts + cfg.homeAdv);
  const expectedAway = Math.max(0.15, (aAtt * hDef) / cfg.pts);
  const expectedTotal = expectedHome + expectedAway;

  if (sport === 'Fútbol' || sport === 'Béisbol') {
    const max = sport === 'Fútbol' ? 8 : 16;
    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;
    let btts = 0;
    const scores: { score: string; prob: number }[] = [];
    const totals = new Array(max * 2 + 1).fill(0);
    for (let h = 0; h <= max; h++) {
      for (let a = 0; a <= max; a++) {
        const p = poisson(h, expectedHome) * poisson(a, expectedAway);
        if (h > a) homeWin += p;
        else if (h === a) draw += p;
        else awayWin += p;
        if (h > 0 && a > 0) btts += p;
        totals[h + a] += p;
        scores.push({ score: `${h} - ${a}`, prob: p });
      }
    }
    const line = marketTotalLine ?? (sport === 'Fútbol' ? 2.5 : 8.5);
    let over = 0;
    totals.forEach((p, t) => {
      if (t > line) over += p;
    });
    scores.sort((x, y) => y.prob - x.prob);
    const bucketMax = sport === 'Fútbol' ? 5 : 12;
    const dist: { label: string; prob: number }[] = [];
    let rest = 0;
    totals.forEach((p, t) => {
      if (t < bucketMax) dist.push({ label: String(t), prob: round(p * 100, 1) });
      else rest += p;
    });
    dist.push({ label: `${bucketMax}+`, prob: round(rest * 100, 1) });

    return {
      method: sport === 'Fútbol' ? 'Poisson (goles a favor/en contra, últimos partidos)' : 'Poisson (carreras recientes)',
      homeWin: round(homeWin * 100),
      draw: sport === 'Fútbol' ? round(draw * 100) : 0,
      awayWin: round(awayWin * 100 + (sport === 'Fútbol' ? 0 : draw * 50)),
      expectedHome: round(expectedHome, 2),
      expectedAway: round(expectedAway, 2),
      expectedTotal: round(expectedTotal, 2),
      totalLine: line,
      overProb: round(over * 100),
      underProb: round((1 - over) * 100),
      bttsProb: sport === 'Fútbol' ? round(btts * 100) : null,
      likelyScore: scores[0]?.score ?? '1 - 1',
      topScores: scores.slice(0, 6).map((s) => ({ score: s.score, prob: round(s.prob * 100, 1) })),
      totalsDistribution: dist,
      homeForm,
      awayForm,
    };
  }

  // Deportes de puntuación alta: Normal
  const margin = expectedHome - expectedAway;
  const sdMargin = cfg.sd;
  const homeWin = normCdf(margin / sdMargin);
  const line = marketTotalLine ?? Math.round(expectedTotal) + 0.5;
  const sdTotal = cfg.sd * 1.25;
  const over = 1 - normCdf((line - expectedTotal) / sdTotal);
  const dist: { label: string; prob: number }[] = [];
  const step = sport === 'Baloncesto' ? 10 : 7;
  const start = Math.round(expectedTotal - step * 3);
  for (let i = 0; i < 6; i++) {
    const lo = start + i * step;
    const hi = lo + step;
    const p = normCdf((hi - expectedTotal) / sdTotal) - normCdf((lo - expectedTotal) / sdTotal);
    dist.push({ label: `${lo}-${hi}`, prob: round(p * 100, 1) });
  }
  const eh = Math.round(expectedHome);
  const ea = Math.round(expectedAway);
  return {
    method: 'Normal (puntos anotados/recibidos, últimos partidos)',
    homeWin: round(homeWin * 100),
    draw: 0,
    awayWin: round((1 - homeWin) * 100),
    expectedHome: round(expectedHome, 1),
    expectedAway: round(expectedAway, 1),
    expectedTotal: round(expectedTotal, 1),
    totalLine: line,
    overProb: round(over * 100),
    underProb: round((1 - over) * 100),
    bttsProb: null,
    likelyScore: `${eh} - ${ea}`,
    topScores: [],
    totalsDistribution: dist,
    homeForm,
    awayForm,
  };
}

/** Convierte cuotas americanas a decimales */
export function americanToDecimal(odds: unknown): number | null {
  const raw = typeof odds === 'object' && odds !== null ? (odds as { moneyLine?: unknown }).moneyLine : odds;
  const n = Number(raw);
  if (!isFinite(n) || n === 0) return null;
  if (n > 0) return Number((1 + n / 100).toFixed(2));
  return Number((1 + 100 / Math.abs(n)).toFixed(2));
}

/** Probabilidades sin margen (no-vig) a partir de cuotas decimales */
export function noVig(home: number, away: number, draw?: number | null) {
  const rh = 1 / home;
  const ra = 1 / away;
  const rd = draw ? 1 / draw : 0;
  const sum = rh + ra + rd;
  return {
    home: round((rh / sum) * 100),
    away: round((ra / sum) * 100),
    draw: draw ? round((rd / sum) * 100) : null,
    margin: round((sum - 1) * 100, 1),
  };
}
