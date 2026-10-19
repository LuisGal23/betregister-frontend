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
