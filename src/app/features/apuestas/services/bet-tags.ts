export const LEAGUE_TAGS = [
  'Sin clasificar',
  'NFL',
  'MLB',
  'MLS',
  'KBO',
  'NBA',
  'Fútbol Europeo',
  'Selecciones',
  'Liga MX',
  'Mixto',
  'Otro',
];

export const MARKET_TAGS = [
  'Sin clasificar',
  'Moneyline',
  'Total de goles',
  'Ambos equipos anotan',
  'Doble oportunidad',
  'Hándicap asiático',
  'Hándicap europeo',
  'Empate no acción (DNB)',
  'Tiros a puerta de jugador',
  'Tiros totales de jugador',
  'Goleador en cualquier momento',
  'Primer goleador',
  'Jugador anota 2+ goles',
  'Pases de jugador',
  'Faltas cometidas',
  'Asistencia de jugador',
  'Jugador recibe tarjeta',
  'Total córners',
  'Total tarjetas',
  'Touchdown en cualquier momento',
  'Primer touchdown',
  'Jugador anota 2+ touchdowns',
  'Yardas por pase de QB',
  'Pases de touchdown de QB',
  'Pases completos de QB',
  'Intercepciones de QB',
  'Yardas terrestres',
  'Yardas por recepción',
  'Recepciones totales',
  'Puntos de jugador',
  'Rebotes de jugador',
  'Asistencias de jugador',
  'Triples anotados',
  'Puntos + Rebotes + Asistencias (PRA)',
  'Robos de jugador',
  'Bloqueos de jugador',
  'Ponches de pitcher',
  'Outs registrados por pitcher',
  'Hits permitidos por pitcher',
  'Hits de bateador',
  'Home Run (Cuadrangular)',
  'Carreras impulsadas (RBI)',
  'Bases totales de bateador',
  'Run Line (-1.5 / +1.5)',
  'Total de carreras',
  'Total de puntos',
  'Hándicap / Spread puntos',
  'Primeras 5 entradas (F5 Moneyline)',
  // Legacy aliases for backward compatibility:
  'ML',
  'Over',
  'Under',
  'Hándicap',
  'Ambos anotan',
  'Mixto',
  'Otro',
  'Over goles',
  'Under goles',
  'Empate',
  'Over carreras',
  'Under carreras',
  'Run line',
  'Over puntos',
  'Under puntos',
  'Spread puntos',
  'Goles',
  'Córners',
  'Tarjetas',
  'Carreras',
  'Puntos',
  'Hándicap asiático',
  'Triples',
  'Rebotes',
  'Asistencias',
  'Yardas',
  'Ponches',
  'Hits',
  'Props jugador',
  'Over triples',
  'Under triples',
  'Over rebotes',
  'Under rebotes',
  'Over asistencias',
  'Under asistencias',
  'Over yardas',
  'Under yardas',
];

export const SPORT_TAGS = [
  'Fútbol',
  'Béisbol',
  'Americano',
  'Básquetbol',
  'Mixto',
  'Otro',
  'Sin clasificar',
];

export interface TagFilter {
  sport: string;
  league: string;
  market: string;
}

export function matchesTags(
  bet: { sport_tag?: string; league_tag?: string; market_tag?: string },
  filter: TagFilter,
) {
  return (
    (!filter.sport || (bet.sport_tag ?? 'Sin clasificar') === filter.sport) &&
    (!filter.league || (bet.league_tag ?? 'Sin clasificar') === filter.league) &&
    (!filter.market || (bet.market_tag ?? 'Sin clasificar') === filter.market)
  );
}

export const SPORT_BY_LEAGUE: Record<string, string> = {
  NFL: 'Americano',
  MLB: 'Béisbol',
  KBO: 'Béisbol',
  NBA: 'Básquetbol',
  MLS: 'Fútbol',
  Selecciones: 'Fútbol',
  'Fútbol Europeo': 'Fútbol',
  'Liga MX': 'Fútbol',
  Mixto: 'Mixto',
  Otro: 'Otro',
  'Sin clasificar': 'Sin clasificar',
};

export const MARKETS_BY_SPORT: Record<string, string[]> = {
  Fútbol: [
    'Moneyline',
    'Total de goles',
    'Ambos equipos anotan',
    'Doble oportunidad',
    'Hándicap asiático',
    'Tiros a puerta de jugador',
    'Tiros totales de jugador',
    'Goleador en cualquier momento',
    'Primer goleador',
    'Jugador anota 2+ goles',
    'Pases de jugador',
    'Faltas cometidas',
    'Asistencia de jugador',
    'Total córners',
    'Total tarjetas',
    'Total goles local',
    'Total goles visitante',
    'Empate no acción (DNB)',
    'ML',
    'Goles',
    'Córners',
    'Tarjetas',
    'Ambos anotan',
    'Hándicap',
    'Props jugador',
    'Otro',
  ],
  Americano: [
    'Moneyline',
    'Hándicap / Spread puntos',
    'Total de puntos',
    'Touchdown en cualquier momento',
    'Primer touchdown',
    'Jugador anota 2+ touchdowns',
    'Yardas por pase de QB',
    'Pases de touchdown de QB',
    'Pases completos de QB',
    'Intercepciones de QB',
    'Yardas terrestres',
    'Yardas por recepción',
    'Recepciones totales',
    'Puntos',
    'Hándicap',
    'ML',
    'Yardas',
    'Props jugador',
    'Otro',
  ],
  Básquetbol: [
    'Moneyline',
    'Hándicap / Spread puntos',
    'Total de puntos',
    'Puntos de jugador',
    'Rebotes de jugador',
    'Asistencias de jugador',
    'Triples anotados',
    'Puntos + Rebotes + Asistencias (PRA)',
    'Robos de jugador',
    'Bloqueos de jugador',
    'Puntos',
    'Hándicap',
    'ML',
    'Triples',
    'Rebotes',
    'Asistencias',
    'Props jugador',
    'Otro',
  ],
  Béisbol: [
    'Moneyline',
    'Run Line (-1.5 / +1.5)',
    'Total de carreras',
    'Ponches de pitcher',
    'Outs registrados por pitcher',
    'Hits permitidos por pitcher',
    'Hits de bateador',
    'Home Run (Cuadrangular)',
    'Carreras impulsadas (RBI)',
    'Bases totales de bateador',
    'Primeras 5 entradas (F5 Moneyline)',
    'Carreras',
    'Hándicap',
    'ML',
    'Run line',
    'Hits',
    'Ponches',
    'Props jugador',
    'Otro',
  ],
  Otro: ['Moneyline', 'Hándicap', 'Total', 'Props jugador', 'Otro'],
  Mixto: [
    'Moneyline',
    'Total de goles',
    'Total de puntos',
    'Total de carreras',
    'Touchdown en cualquier momento',
    'Tiros a puerta de jugador',
    'Puntos de jugador',
    'Ponches de pitcher',
    'Mixto',
    'Otro',
  ],
};

export function sportForLeague(league: string) {
  return SPORT_BY_LEAGUE[league] ?? 'Sin clasificar';
}

export function marketsForLeague(league: string, legacy = '') {
  const options = [
    'Sin clasificar',
    ...(MARKETS_BY_SPORT[sportForLeague(league)] ?? ['Moneyline', 'Total de goles', 'Hándicap']),
    'Mixto',
    'Otro',
  ];
  return ['Over', 'Under', 'Hándicap', 'ML'].includes(legacy) && !options.includes(legacy)
    ? [...options, legacy]
    : options;
}

export function marketLabel(market: string) {
  return market === 'ML'
    ? 'Moneyline (ML)'
    : ['Over', 'Under'].includes(market)
      ? market + ' · sin unidad registrada'
      : market;
}

export function toDatabaseMarketTag(market: string, league?: string): string {
  if (!market) return 'Sin clasificar';
  const m = market.toLowerCase().trim();
  const l = (league || '').trim();

  // If NBA, avoid returning 'Puntos' which backend bet_tags.py SPECIFIC_MARKETS strictly binds to 'Americano'
  if (l === 'NBA') {
    if (m.includes('tripl')) return 'Triples';
    if (m.includes('rebot')) return 'Rebotes';
    if (m.includes('asist')) return 'Asistencias';
    if (m.includes('punt') || m.includes('prop')) return 'Props jugador';
    if (m.includes('over')) return 'Over';
    if (m.includes('under')) return 'Under';
    if (m === 'ml' || m.includes('moneyline') || m.includes('ganad') || m.includes('victor')) return 'ML';
    if (m.includes('hándicap') || m.includes('handicap') || m.includes('spread')) return 'Hándicap';
    return 'Otro';
  }

  if (m === 'ml' || m.includes('moneyline') || m.includes('1x2') || m.includes('ganador') || m.includes('victoria')) return 'ML';
  if (m.includes('ambos') || m.includes('btts')) return 'Ambos anotan';
  if (m.includes('córner') || m.includes('corner')) return 'Córners';
  if (m.includes('tarjeta')) return 'Tarjetas';
  if (m.includes('asiático') || m.includes('asiatico')) return 'Hándicap asiático';
  if (m.includes('hándicap') || m.includes('handicap') || m.includes('spread') || m.includes('run line')) return 'Hándicap';
  if (m.includes('gol')) return 'Goles';
  if (m.includes('carrera')) return 'Carreras';
  if (m.includes('yarda')) return 'Yardas';
  if (m.includes('tripl')) return 'Triples';
  if (m.includes('rebot')) return 'Rebotes';
  if (m.includes('asist')) return 'Asistencias';
  if (m.includes('hit')) return 'Hits';
  if (m.includes('ponch')) return 'Ponches';
  if (m.includes('punto')) return l === 'NFL' ? 'Puntos' : 'Props jugador';
  if (m.includes('prop')) return 'Props jugador';
  if (m.includes('mixto')) return 'Mixto';
  if (m.includes('over')) return 'Over';
  if (m.includes('under')) return 'Under';
  if (m.includes('empate')) return 'Empate';
  return 'Otro';
}

export function toDatabaseLeagueTag(league: string): string {
  if (!league) return 'Sin clasificar';
  const l = league.trim();
  if (LEAGUE_TAGS.includes(l)) return l;
  const lLower = l.toLowerCase();
  if (lLower === 'nba' || lLower.includes('basket') || lLower.includes('baloncest')) return 'NBA';
  if (lLower === 'nfl' || lLower.includes('american')) return 'NFL';
  if (lLower === 'mlb' || lLower.includes('beisbol') || lLower.includes('béisbol')) return 'MLB';
  if (lLower === 'kbo') return 'KBO';
  if (lLower === 'mls') return 'MLS';
  if (lLower.includes('mx') || lLower.includes('liga mx')) return 'Liga MX';
  if (lLower.includes('selecci') || lLower.includes('nation') || lLower.includes('friendl') || lLower.includes('world') || lLower.includes('euro') || lLower.includes('copa')) return 'Selecciones';
  if (lLower.includes('premier') || lLower.includes('laliga') || lLower.includes('seriea') || lLower.includes('bundes') || lLower.includes('ligue') || lLower.includes('champ') || lLower.includes('europ')) return 'Fútbol Europeo';
  if (lLower === 'mixto') return 'Mixto';
  return 'Otro';
}
