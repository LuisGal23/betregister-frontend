export interface InsightBet {
  selection_details?: { sport: string; market: string; description?: string }[];
  id: number;
  house_id: number;
  event: string;
  status: string;
  stake: number;
  payout: number;
  currency: string;
  sport_tag?: string;
  market_tag?: string;
  bet_type?: string;
  created: string;
}
export interface MarketInsight {
  key: string;
  sport: string;
  market: string;
  type: string;
  tickets: InsightBet[];
  total: number;
  closed: number;
  won: number;
  lost: number;
  cashout: number;
  pending: number;
  voided: number;
  profit: number | null;
  staked: number | null;
  winRate: number | null;
  yield: number | null;
}
// Normalize only explicit legacy units; generic Over/Under cannot be inferred safely.
export function insightCategories(bet: InsightBet) {
  const aliases: Record<string, string> = {
    'Over goles': 'Goles',
    'Under goles': 'Goles',
    'Over carreras': 'Carreras',
    'Under carreras': 'Carreras',
    'Over puntos': 'Puntos',
    'Under puntos': 'Puntos',
    'Run line': 'Hándicap',
    'Spread puntos': 'Hándicap',
    Empate: 'ML',
  };
  const categories = bet.selection_details?.length
    ? bet.selection_details
    : [{ sport: bet.sport_tag || 'Sin clasificar', market: bet.market_tag || 'Sin clasificar' }];
  return [
    ...new Map(
      categories.map((d) => {
        const value = { sport: d.sport, market: aliases[d.market] ?? d.market };
        return [JSON.stringify(value), value];
      }),
    ).values(),
  ];
}
export function matchesInsightTags(bet: InsightBet, sport: string, market: string) {
  return insightCategories(bet).some(
    (d) => (!sport || d.sport === sport) && (!market || d.market === market),
  );
}
export function groupMarkets(
  bets: InsightBet[],
  convert: (minor: number, currency: string) => number | null,
  mode: 'detailed' | 'market' | 'type' = 'detailed',
): MarketInsight[] {
  const groups = new Map<string, MarketInsight>();
  for (const bet of bets) {
    const categories =
      mode === 'type'
        ? [
            {
              sport: 'Todos los deportes',
              market:
                bet.bet_type === 'parlay'
                  ? 'Parlays'
                  : bet.bet_type === 'same_game'
                    ? 'Combinadas del mismo partido'
                    : 'Derechas / simples',
            },
          ]
        : mode === 'market'
          ? insightCategories(bet)
          : [
              {
                sport: bet.sport_tag || 'Sin clasificar',
                market: bet.market_tag || 'Sin clasificar',
              },
            ];
    for (const category of categories) {
      const sport = category.sport || 'Sin clasificar',
        market = category.market,
        type = mode === 'market' ? 'all' : bet.bet_type || 'simple';
      const key = JSON.stringify([sport, market, type]);
      if (!groups.has(key))
        groups.set(key, {
          key,
          sport,
          market,
          type,
          tickets: [],
          total: 0,
          closed: 0,
          won: 0,
          lost: 0,
          cashout: 0,
          pending: 0,
          voided: 0,
          profit: 0,
          staked: 0,
          winRate: null,
          yield: null,
        });
      const group = groups.get(key)!;
      group.total++;
      group.tickets.push(bet);
      if (bet.status === 'pending') {
        group.pending++;
        continue;
      }
      if (bet.status === 'void') {
        group.voided++;
        continue;
      }
      if (!['won', 'lost', 'cashout'].includes(bet.status)) continue;
      group.closed++;
      if (bet.status === 'won') group.won++;
      if (bet.status === 'lost') group.lost++;
      if (bet.status === 'cashout') group.cashout++;
      const stake = convert(bet.stake, bet.currency),
        profit = convert(bet.payout - bet.stake, bet.currency);
      group.staked = stake === null || group.staked === null ? null : group.staked + stake;
      group.profit = profit === null || group.profit === null ? null : group.profit + profit;
    }
  }
  for (const group of groups.values()) {
    group.winRate = group.won + group.lost ? (group.won / (group.won + group.lost)) * 100 : null;
    group.yield =
      group.staked && group.profit !== null ? (group.profit / group.staked) * 100 : null;
  }
  return [...groups.values()];
}
export function rankedMarkets(groups: MarketInsight[]) {
  // Keep unclassified/generic and mixed selections in the table, not in market conclusions.
  const eligible = groups.filter(
    (g) =>
      g.closed > 0 &&
      g.profit !== null &&
      !['Sin clasificar', 'Mixto', 'Otro'].includes(g.sport) &&
      !['Sin clasificar', 'Mixto', 'Otro', 'Over', 'Under'].includes(g.market),
  );
  return {
    best:
      eligible
        .filter((g) => g.profit! > 0)
        .sort((a, b) => b.profit! - a.profit! || b.closed - a.closed)[0] ?? null,
    worst:
      eligible
        .filter((g) => g.profit! < 0)
        .sort((a, b) => a.profit! - b.profit! || b.closed - a.closed)[0] ?? null,
    frequent: [...groups].sort((a, b) => b.total - a.total)[0] ?? null,
  };
}
