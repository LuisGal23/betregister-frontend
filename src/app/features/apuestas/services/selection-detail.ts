export type MarketCategory = 'principales' | 'props_jugador' | 'especiales';
export type MarketInputType =
  | 'moneyline'
  | 'total'
  | 'handicap'
  | 'player_over_under'
  | 'player_anytime'
  | 'both_score'
  | 'double_chance'
  | 'draw_no_bet'
  | 'custom';

export interface MarketDef {
  id: string;
  label: string;
  category: MarketCategory;
  sport: string;
  type: MarketInputType;
  hint: string;
  defaultPick?: string;
  defaultLine?: number;
  placeholder?: string;
}

export interface SelectionDetail {
  source_text?: string;
  sport: string;
  market: string;
  pick: string;
  line: number | null;
  description: string;
  player?: string;
  game_id: string;
  event_label: string;
  prediction_id?: number | null;
}

export const SOCCER_MARKETS: MarketDef[] = [
  // Principales
  { id: 'Moneyline', label: 'Moneyline (1X2 Ganador)', category: 'principales', sport: 'Fútbol', type: 'moneyline', hint: 'Ganador local, empate o visitante', defaultPick: 'Local' },
  { id: 'Total de goles', label: 'Total de goles (Más / Menos)', category: 'principales', sport: 'Fútbol', type: 'total', hint: 'Total de anotaciones en el tiempo regular', defaultPick: 'Más de', defaultLine: 2.5 },
  { id: 'Ambos equipos anotan', label: 'Ambos anotan (BTTS)', category: 'principales', sport: 'Fútbol', type: 'both_score', hint: 'Ambos equipos marcan al menos 1 gol', defaultPick: 'Sí' },
  { id: 'Doble oportunidad', label: 'Doble oportunidad', category: 'principales', sport: 'Fútbol', type: 'double_chance', hint: '1X (Local o Empate), 12 o X2', defaultPick: '1X (Local o Empate)' },
  { id: 'Hándicap asiático', label: 'Hándicap asiático', category: 'principales', sport: 'Fútbol', type: 'handicap', hint: 'Línea asiática de ventaja (+ / -)', defaultPick: 'Local', defaultLine: -0.5 },
  { id: 'Hándicap europeo', label: 'Hándicap europeo', category: 'principales', sport: 'Fútbol', type: 'handicap', hint: 'Ventaja fija de 3 opciones (-1, +1, etc.)', defaultPick: 'Local', defaultLine: -1 },
  { id: 'Empate no acción (DNB)', label: 'Empate no acción (DNB)', category: 'principales', sport: 'Fútbol', type: 'draw_no_bet', hint: 'Si hay empate se anula y reembolsa la selección', defaultPick: 'Local' },
  
  // Props de Jugador
  { id: 'Tiros a puerta de jugador', label: 'Tiros a puerta de jugador', category: 'props_jugador', sport: 'Fútbol', type: 'player_over_under', hint: 'Disparos a portería directos del jugador', defaultPick: 'Más de', defaultLine: 1.5, placeholder: 'Ej. Vinícius Jr., Mbappé' },
  { id: 'Tiros totales de jugador', label: 'Tiros totales de jugador', category: 'props_jugador', sport: 'Fútbol', type: 'player_over_under', hint: 'Disparos totales intentados por el jugador', defaultPick: 'Más de', defaultLine: 2.5, placeholder: 'Ej. Erling Haaland, Harry Kane' },
  { id: 'Goleador en cualquier momento', label: 'Goleador cualquier momento', category: 'props_jugador', sport: 'Fútbol', type: 'player_anytime', hint: 'El jugador anota al menos un gol en el partido', defaultPick: 'Anotará', placeholder: 'Ej. Robert Lewandowski, Salah' },
  { id: 'Primer goleador', label: 'Primer goleador del partido', category: 'props_jugador', sport: 'Fútbol', type: 'player_anytime', hint: 'El jugador marca el primer tanto del encuentro', defaultPick: 'Primer goleador', placeholder: 'Ej. Lionel Messi' },
  { id: 'Jugador anota 2+ goles', label: 'Jugador anota 2+ goles (Doblete)', category: 'props_jugador', sport: 'Fútbol', type: 'player_anytime', hint: 'El jugador marca doblete o más goles', defaultPick: '2+ goles', placeholder: 'Ej. Kylian Mbappé' },
  { id: 'Pases de jugador', label: 'Pases de jugador', category: 'props_jugador', sport: 'Fútbol', type: 'player_over_under', hint: 'Pases completados por el futbolista', defaultPick: 'Más de', defaultLine: 45.5, placeholder: 'Ej. Toni Kroos, Rodri' },
  { id: 'Faltas cometidas', label: 'Faltas cometidas por jugador', category: 'props_jugador', sport: 'Fútbol', type: 'player_over_under', hint: 'Infracciones cometidas por el jugador', defaultPick: 'Más de', defaultLine: 1.5, placeholder: 'Ej. Casemiro, Cristian Romero' },
  { id: 'Asistencia de jugador', label: 'Asistencia de gol', category: 'props_jugador', sport: 'Fútbol', type: 'player_anytime', hint: 'El jugador da al menos un pase de gol', defaultPick: 'Dará asistencia', placeholder: 'Ej. Kevin De Bruyne' },
  { id: 'Jugador recibe tarjeta', label: 'Jugador recibe tarjeta', category: 'props_jugador', sport: 'Fútbol', type: 'player_anytime', hint: 'El jugador es amonestado en el partido', defaultPick: 'Amonestado', placeholder: 'Ej. Sergio Ramos' },

  // Especiales
  { id: 'Total córners', label: 'Total de córners', category: 'especiales', sport: 'Fútbol', type: 'total', hint: 'Saques de esquina combinados en el encuentro', defaultPick: 'Más de', defaultLine: 9.5 },
  { id: 'Total tarjetas', label: 'Total de tarjetas', category: 'especiales', sport: 'Fútbol', type: 'total', hint: 'Tarjetas amarillas / rojas en el partido', defaultPick: 'Más de', defaultLine: 4.5 },
  { id: 'Total goles local', label: 'Total goles de local', category: 'especiales', sport: 'Fútbol', type: 'total', hint: 'Goles marcados por el equipo anfitrión', defaultPick: 'Más de', defaultLine: 1.5 },
  { id: 'Total goles visitante', label: 'Total goles de visita', category: 'especiales', sport: 'Fútbol', type: 'total', hint: 'Goles marcados por el equipo visitante', defaultPick: 'Más de', defaultLine: 1.5 },
  { id: 'Ambos anotan y más de 2.5', label: 'Ambos anotan y Más de 2.5', category: 'especiales', sport: 'Fútbol', type: 'both_score', hint: 'Combinada: ambos marcan y 3+ goles totales', defaultPick: 'Sí' },
  { id: 'Otro', label: 'Otro mercado personalizado', category: 'especiales', sport: 'Fútbol', type: 'custom', hint: 'Mercado especial libre', defaultPick: '', placeholder: 'Describe el mercado' },
];

export const NFL_MARKETS: MarketDef[] = [
  // Principales
  { id: 'Moneyline', label: 'Moneyline (Ganador)', category: 'principales', sport: 'Americano', type: 'moneyline', hint: 'Ganador directo del encuentro', defaultPick: 'Local' },
  { id: 'Hándicap / Spread puntos', label: 'Hándicap / Spread de puntos', category: 'principales', sport: 'Americano', type: 'handicap', hint: 'Ventaja o desventaja en puntos (+ / -)', defaultPick: 'Local', defaultLine: -3.5 },
  { id: 'Total de puntos', label: 'Total de puntos (Más / Menos)', category: 'principales', sport: 'Americano', type: 'total', hint: 'Puntos combinados de ambos equipos', defaultPick: 'Más de', defaultLine: 45.5 },
  { id: 'Total puntos local', label: 'Puntos de local', category: 'principales', sport: 'Americano', type: 'total', hint: 'Puntos sumados por el equipo anfitrión', defaultPick: 'Más de', defaultLine: 24.5 },
  { id: 'Total puntos visitante', label: 'Puntos de visita', category: 'principales', sport: 'Americano', type: 'total', hint: 'Puntos sumados por el equipo visitante', defaultPick: 'Más de', defaultLine: 20.5 },

  // Props de Jugador
  { id: 'Touchdown en cualquier momento', label: 'Touchdown cualquier momento (Anytime TD)', category: 'props_jugador', sport: 'Americano', type: 'player_anytime', hint: 'El jugador anota al menos un touchdown', defaultPick: 'Anotará TD', placeholder: 'Ej. Travis Kelce, Derrick Henry' },
  { id: 'Primer touchdown', label: 'Primer touchdown del partido', category: 'props_jugador', sport: 'Americano', type: 'player_anytime', hint: 'El jugador anota la 1ª anotación del juego', defaultPick: 'Primer TD', placeholder: 'Ej. Christian McCaffrey' },
  { id: 'Jugador anota 2+ touchdowns', label: 'Jugador anota 2+ touchdowns', category: 'props_jugador', sport: 'Americano', type: 'player_anytime', hint: 'El jugador anota 2 o más touchdowns', defaultPick: '2+ TDs', placeholder: 'Ej. Tyreek Hill' },
  { id: 'Yardas por pase de QB', label: 'Yardas por pase de QB', category: 'props_jugador', sport: 'Americano', type: 'player_over_under', hint: 'Yardas aéreas conseguidas por el quarterback', defaultPick: 'Más de', defaultLine: 245.5, placeholder: 'Ej. Patrick Mahomes, Lamar Jackson' },
  { id: 'Pases de touchdown de QB', label: 'Pases de touchdown (TD passes)', category: 'props_jugador', sport: 'Americano', type: 'player_over_under', hint: 'Pases de anotación lanzados por el mariscal', defaultPick: 'Más de', defaultLine: 1.5, placeholder: 'Ej. Josh Allen, Joe Burrow' },
  { id: 'Pases completos de QB', label: 'Pases completos de QB', category: 'props_jugador', sport: 'Americano', type: 'player_over_under', hint: 'Total de envíos completos por el QB', defaultPick: 'Más de', defaultLine: 21.5, placeholder: 'Ej. Dak Prescott, Brock Purdy' },
  { id: 'Intercepciones de QB', label: 'Intercepciones de QB', category: 'props_jugador', sport: 'Americano', type: 'player_over_under', hint: 'Intercepciones sufridas por el lanzador', defaultPick: 'Más de', defaultLine: 0.5, placeholder: 'Ej. Jalen Hurts' },
  { id: 'Yardas terrestres', label: 'Yardas terrestres de jugador', category: 'props_jugador', sport: 'Americano', type: 'player_over_under', hint: 'Yardas ganadas acarreando el ovoide', defaultPick: 'Más de', defaultLine: 65.5, placeholder: 'Ej. Saquon Barkley, Bijan Robinson' },
  { id: 'Yardas por recepción', label: 'Yardas por recepción', category: 'props_jugador', sport: 'Americano', type: 'player_over_under', hint: 'Yardas ganadas por aire recibiendo balones', defaultPick: 'Más de', defaultLine: 55.5, placeholder: 'Ej. Justin Jefferson, CeeDee Lamb' },
  { id: 'Recepciones totales', label: 'Recepciones totales de jugador', category: 'props_jugador', sport: 'Americano', type: 'player_over_under', hint: 'Cantidad de pases atrapados por el receptor/ala cerrada', defaultPick: 'Más de', defaultLine: 5.5, placeholder: 'Ej. Amon-Ra St. Brown' },

  // Especiales
  { id: 'Hándicap 1ª mitad', label: 'Hándicap 1ª mitad', category: 'especiales', sport: 'Americano', type: 'handicap', hint: 'Línea de hándicap al medio tiempo', defaultPick: 'Local', defaultLine: -1.5 },
  { id: 'Total puntos 1ª mitad', label: 'Total puntos 1ª mitad', category: 'especiales', sport: 'Americano', type: 'total', hint: 'Puntos en los primeros 2 cuartos', defaultPick: 'Más de', defaultLine: 22.5 },
  { id: 'Otro', label: 'Otro mercado personalizado', category: 'especiales', sport: 'Americano', type: 'custom', hint: 'Mercado especial libre', defaultPick: '', placeholder: 'Describe el mercado' },
];

export const NBA_MARKETS: MarketDef[] = [
  // Principales
  { id: 'Moneyline', label: 'Moneyline (Ganador)', category: 'principales', sport: 'Básquetbol', type: 'moneyline', hint: 'Ganador incluyendo tiempo extra', defaultPick: 'Local' },
  { id: 'Hándicap / Spread puntos', label: 'Hándicap / Spread de puntos', category: 'principales', sport: 'Básquetbol', type: 'handicap', hint: 'Diferencia de puntos ajustada por línea', defaultPick: 'Local', defaultLine: -5.5 },
  { id: 'Total de puntos', label: 'Total de puntos (Más / Menos)', category: 'principales', sport: 'Básquetbol', type: 'total', hint: 'Puntos acumulados totales de ambos equipos', defaultPick: 'Más de', defaultLine: 224.5 },
  { id: 'Total puntos local', label: 'Puntos de local', category: 'principales', sport: 'Básquetbol', type: 'total', hint: 'Puntos sumados por el equipo anfitrión', defaultPick: 'Más de', defaultLine: 112.5 },
  { id: 'Total puntos visitante', label: 'Puntos de visita', category: 'principales', sport: 'Básquetbol', type: 'total', hint: 'Puntos sumados por el equipo visitante', defaultPick: 'Más de', defaultLine: 109.5 },

  // Props de Jugador
  { id: 'Puntos de jugador', label: 'Puntos de jugador', category: 'props_jugador', sport: 'Básquetbol', type: 'player_over_under', hint: 'Puntos encestados por el jugador', defaultPick: 'Más de', defaultLine: 24.5, placeholder: 'Ej. Luka Dončić, Giannis' },
  { id: 'Rebotes de jugador', label: 'Rebotes de jugador', category: 'props_jugador', sport: 'Básquetbol', type: 'player_over_under', hint: 'Rebotes ofensivos y defensivos capturados', defaultPick: 'Más de', defaultLine: 8.5, placeholder: 'Ej. Nikola Jokić, Domantas Sabonis' },
  { id: 'Asistencias de jugador', label: 'Asistencias de jugador', category: 'props_jugador', sport: 'Básquetbol', type: 'player_over_under', hint: 'Pases de anotación repartidos', defaultPick: 'Más de', defaultLine: 6.5, placeholder: 'Ej. Tyrese Haliburton, Trae Young' },
  { id: 'Triples anotados', label: 'Triples anotados por jugador', category: 'props_jugador', sport: 'Básquetbol', type: 'player_over_under', hint: 'Canastas de tres puntos encestadas', defaultPick: 'Más de', defaultLine: 2.5, placeholder: 'Ej. Stephen Curry, Klay Thompson' },
  { id: 'Puntos + Rebotes + Asistencias (PRA)', label: 'Puntos + Rebotes + Asistencias (PRA)', category: 'props_jugador', sport: 'Básquetbol', type: 'player_over_under', hint: 'Suma combinada de puntos, rebotes y asistencias', defaultPick: 'Más de', defaultLine: 35.5, placeholder: 'Ej. LeBron James, Shai Gilgeous' },
  { id: 'Robos de jugador', label: 'Robos de balón', category: 'props_jugador', sport: 'Básquetbol', type: 'player_over_under', hint: 'Balones recuperados en defensa', defaultPick: 'Más de', defaultLine: 1.5, placeholder: 'Ej. Alex Caruso' },
  { id: 'Bloqueos de jugador', label: 'Bloqueos / Tapones de jugador', category: 'props_jugador', sport: 'Básquetbol', type: 'player_over_under', hint: 'Tiros rivales taponados', defaultPick: 'Más de', defaultLine: 1.5, placeholder: 'Ej. Victor Wembanyama' },
  { id: 'Doble-Doble / Triple-Doble', label: 'Doble-Doble o Triple-Doble', category: 'props_jugador', sport: 'Básquetbol', type: 'player_anytime', hint: 'Logra 2 o 3 estadísticas en doble dígito', defaultPick: 'Doble-Doble', placeholder: 'Ej. Anthony Davis' },

  // Especiales
  { id: 'Hándicap 1er cuarto', label: 'Hándicap 1er cuarto', category: 'especiales', sport: 'Básquetbol', type: 'handicap', hint: 'Línea de hándicap solo en el 1Q', defaultPick: 'Local', defaultLine: -1.5 },
  { id: 'Total 1ª mitad', label: 'Total puntos 1ª mitad', category: 'especiales', sport: 'Básquetbol', type: 'total', hint: 'Puntos combinados en 1Q + 2Q', defaultPick: 'Más de', defaultLine: 110.5 },
  { id: 'Otro', label: 'Otro mercado personalizado', category: 'especiales', sport: 'Básquetbol', type: 'custom', hint: 'Mercado especial libre', defaultPick: '', placeholder: 'Describe el mercado' },
];

export const MLB_MARKETS: MarketDef[] = [
  // Principales
  { id: 'Moneyline', label: 'Moneyline (Ganador)', category: 'principales', sport: 'Béisbol', type: 'moneyline', hint: 'Ganador del juego de béisbol', defaultPick: 'Local' },
  { id: 'Run Line (-1.5 / +1.5)', label: 'Run Line (-1.5 / +1.5)', category: 'principales', sport: 'Béisbol', type: 'handicap', hint: 'Hándicap estándar de carreras en béisbol', defaultPick: 'Local', defaultLine: -1.5 },
  { id: 'Total de carreras', label: 'Total de carreras (Más / Menos)', category: 'principales', sport: 'Béisbol', type: 'total', hint: 'Carreras combinadas de ambos clubes', defaultPick: 'Más de', defaultLine: 8.5 },
  { id: 'Primeras 5 entradas (F5 Moneyline)', label: 'Primeras 5 entradas (F5 Ganador)', category: 'principales', sport: 'Béisbol', type: 'moneyline', hint: 'Ganador en los primeros 5 innings', defaultPick: 'Local' },
  { id: 'Total carreras F5', label: 'Total carreras F5 (1as 5 entradas)', category: 'principales', sport: 'Béisbol', type: 'total', hint: 'Carreras totales en los primeros 5 innings', defaultPick: 'Más de', defaultLine: 4.5 },

  // Props de Jugador
  { id: 'Ponches de pitcher', label: 'Ponches de pitcher (Strikeouts)', category: 'props_jugador', sport: 'Béisbol', type: 'player_over_under', hint: 'Chocolates / ponches recetados por el pitcher', defaultPick: 'Más de', defaultLine: 5.5, placeholder: 'Ej. Tarik Skubal, Zack Wheeler' },
  { id: 'Outs registrados por pitcher', label: 'Outs registrados por pitcher', category: 'props_jugador', sport: 'Béisbol', type: 'player_over_under', hint: 'Outs conseguidos en el montículo (18 outs = 6 IP)', defaultPick: 'Más de', defaultLine: 17.5, placeholder: 'Ej. Corbin Burnes' },
  { id: 'Hits permitidos por pitcher', label: 'Hits permitidos por pitcher', category: 'props_jugador', sport: 'Béisbol', type: 'player_over_under', hint: 'Imparables que le conectan al lanzador', defaultPick: 'Menos de', defaultLine: 5.5, placeholder: 'Ej. Cole Ragans' },
  { id: 'Hits de bateador', label: 'Hits de bateador', category: 'props_jugador', sport: 'Béisbol', type: 'player_over_under', hint: 'Imparables conectados por el bateador', defaultPick: 'Más de', defaultLine: 0.5, placeholder: 'Ej. Aaron Judge, Shohei Ohtani' },
  { id: 'Home Run (Cuadrangular)', label: 'Home Run de bateador (Jonrón)', category: 'props_jugador', sport: 'Béisbol', type: 'player_anytime', hint: 'El jugador conecta cuadrangular', defaultPick: 'Bateará HR', placeholder: 'Ej. Juan Soto, Bryce Harper' },
  { id: 'Carreras impulsadas (RBI)', label: 'Carreras impulsadas (RBI)', category: 'props_jugador', sport: 'Béisbol', type: 'player_over_under', hint: 'Carreras remolcadas al plato por el bateador', defaultPick: 'Más de', defaultLine: 0.5, placeholder: 'Ej. Freddie Freeman' },
  { id: 'Bases totales de bateador', label: 'Bases totales de bateador', category: 'props_jugador', sport: 'Béisbol', type: 'player_over_under', hint: 'Bases conseguidas con batazos (1B=1, 2B=2, HR=4)', defaultPick: 'Más de', defaultLine: 1.5, placeholder: 'Ej. Gunnar Henderson' },
  { id: 'Bases robadas', label: 'Bases robadas', category: 'props_jugador', sport: 'Béisbol', type: 'player_over_under', hint: 'Almohadillas estafadas en carrera', defaultPick: 'Más de', defaultLine: 0.5, placeholder: 'Ej. Elly De La Cruz' },

  // Especiales
  { id: 'Total carreras local', label: 'Carreras de local', category: 'especiales', sport: 'Béisbol', type: 'total', hint: 'Carreras anotadas por el equipo de casa', defaultPick: 'Más de', defaultLine: 4.5 },
  { id: 'Total carreras visitante', label: 'Carreras de visita', category: 'especiales', sport: 'Béisbol', type: 'total', hint: 'Carreras anotadas por la visita', defaultPick: 'Más de', defaultLine: 3.5 },
  { id: 'Otro', label: 'Otro mercado personalizado', category: 'especiales', sport: 'Béisbol', type: 'custom', hint: 'Mercado especial libre', defaultPick: '', placeholder: 'Describe el mercado' },
];

export const OTHER_MARKETS: MarketDef[] = [
  { id: 'Moneyline', label: 'Moneyline (Ganador)', category: 'principales', sport: 'Otro', type: 'moneyline', hint: 'Ganador del encuentro', defaultPick: 'Local' },
  { id: 'Hándicap', label: 'Hándicap / Spread', category: 'principales', sport: 'Otro', type: 'handicap', hint: 'Ventaja de línea', defaultPick: 'Local', defaultLine: -1.5 },
  { id: 'Total', label: 'Total (Más / Menos)', category: 'principales', sport: 'Otro', type: 'total', hint: 'Puntos, goles o juegos totales', defaultPick: 'Más de', defaultLine: 2.5 },
  { id: 'Props jugador', label: 'Props de jugador', category: 'props_jugador', sport: 'Otro', type: 'player_over_under', hint: 'Rendimiento individual de un jugador', defaultPick: 'Más de', defaultLine: 1.5, placeholder: 'Nombre del jugador' },
  { id: 'Otro', label: 'Otro mercado personalizado', category: 'especiales', sport: 'Otro', type: 'custom', hint: 'Mercado especial libre', defaultPick: '', placeholder: 'Describe el mercado' },
];

export const ALL_SPORT_MARKET_DEFS: Record<string, MarketDef[]> = {
  Fútbol: SOCCER_MARKETS,
  Americano: NFL_MARKETS,
  Básquetbol: NBA_MARKETS,
  Béisbol: MLB_MARKETS,
  Mixto: [...SOCCER_MARKETS.slice(0, 5), ...NFL_MARKETS.slice(0, 3), ...NBA_MARKETS.slice(0, 3), ...MLB_MARKETS.slice(0, 3)],
  Otro: OTHER_MARKETS,
  'Sin clasificar': OTHER_MARKETS,
};

export function normalizeSportName(sport: string): string {
  if (!sport) return 'Fútbol';
  const s = sport.trim().toLowerCase();
  if (s === 'americano' || s === 'nfl' || s === 'football' || s.includes('american')) return 'Americano';
  if (s === 'básquetbol' || s === 'basquetbol' || s === 'nba' || s === 'basketball') return 'Básquetbol';
  if (s === 'béisbol' || s === 'beisbol' || s === 'mlb' || s === 'kbo' || s === 'baseball') return 'Béisbol';
  if (s === 'fútbol' || s === 'futbol' || s === 'soccer' || s.includes('soccer')) return 'Fútbol';
  if (s === 'mixto') return 'Mixto';
  return 'Fútbol';
}

export function getMarketDefsForSport(sport: string): MarketDef[] {
  const norm = normalizeSportName(sport);
  return ALL_SPORT_MARKET_DEFS[norm] ?? ALL_SPORT_MARKET_DEFS['Fútbol'];
}

export function findMarketDef(sport: string, marketId: string): MarketDef | undefined {
  const list = getMarketDefsForSport(sport);
  const found = list.find((m) => m.id === marketId || m.label === marketId);
  if (found) return found;
  // Fallback search across all definitions
  for (const key of Object.keys(ALL_SPORT_MARKET_DEFS)) {
    const m = ALL_SPORT_MARKET_DEFS[key].find((def) => def.id === marketId || def.label === marketId);
    if (m) return m;
  }
  // Legacy aliases
  if (marketId === 'ML') return list.find((m) => m.id === 'Moneyline');
  if (marketId === 'Goles') return list.find((m) => m.id === 'Total de goles');
  if (marketId === 'Puntos') return list.find((m) => m.id === 'Total de puntos');
  if (marketId === 'Carreras') return list.find((m) => m.id === 'Total de carreras');
  if (marketId === 'Córners') return list.find((m) => m.id === 'Total córners');
  if (marketId === 'Tarjetas') return list.find((m) => m.id === 'Total tarjetas');
  if (marketId === 'Ambos anotan') return list.find((m) => m.id === 'Ambos equipos anotan');
  if (marketId === 'Yardas') return list.find((m) => m.id === 'Yardas por pase de QB');
  if (marketId === 'Ponches') return list.find((m) => m.id === 'Ponches de pitcher');
  if (marketId === 'Hits') return list.find((m) => m.id === 'Hits de bateador');
  if (marketId === 'Triples') return list.find((m) => m.id === 'Triples anotados');
  if (marketId === 'Rebotes') return list.find((m) => m.id === 'Rebotes de jugador');
  if (marketId === 'Asistencias') return list.find((m) => m.id === 'Asistencias de jugador');
  return undefined;
}

// Backward compatibility export with strings
export const SELECTION_MARKETS: Record<string, string[]> = {
  Fútbol: SOCCER_MARKETS.map((m) => m.id),
  Béisbol: MLB_MARKETS.map((m) => m.id),
  Americano: NFL_MARKETS.map((m) => m.id),
  Básquetbol: NBA_MARKETS.map((m) => m.id),
  Mixto: ['Moneyline', 'Total de goles', 'Total de puntos', 'Total de carreras', 'Touchdown en cualquier momento', 'Tiros a puerta de jugador', 'Puntos de jugador', 'Ponches de pitcher', 'Otro'],
  Otro: OTHER_MARKETS.map((m) => m.id),
  'Sin clasificar': OTHER_MARKETS.map((m) => m.id),
};

export function newSelection(sport = 'Fútbol'): SelectionDetail {
  const valid = Object.keys(ALL_SPORT_MARKET_DEFS).includes(sport) ? sport : 'Fútbol';
  const def = getMarketDefsForSport(valid)[0];
  return {
    sport: valid,
    market: def ? def.id : 'Moneyline',
    pick: def ? def.defaultPick ?? 'Local' : 'Local',
    line: def && def.defaultLine !== undefined ? def.defaultLine : null,
    description: '',
    player: '',
    game_id: '',
    event_label: '',
  };
}

export function selectionText(d: SelectionDetail): string {
  if (d.market === 'Otro') {
    return 'Otro: ' + (d.description || '').trim();
  }
  const marketName = d.market === 'ML' ? 'Moneyline' : d.market;
  const playerPart = (d.player || d.description || '').trim();
  
  // If player prop
  if (playerPart && (
    d.market.toLowerCase().includes('jugador') ||
    d.market.toLowerCase().includes('goleador') ||
    d.market.toLowerCase().includes('touchdown') ||
    d.market.toLowerCase().includes('tiros') ||
    d.market.toLowerCase().includes('pases') ||
    d.market.toLowerCase().includes('yardas') ||
    d.market.toLowerCase().includes('recepciones') ||
    d.market.toLowerCase().includes('rebotes') ||
    d.market.toLowerCase().includes('asistencias') ||
    d.market.toLowerCase().includes('triples') ||
    d.market.toLowerCase().includes('ponches') ||
    d.market.toLowerCase().includes('hits') ||
    d.market.toLowerCase().includes('home run') ||
    d.market.toLowerCase().includes('faltas') ||
    d.market.toLowerCase().includes('bases')
  )) {
    return [
      playerPart,
      marketName,
      d.pick,
      d.line !== null && d.line !== undefined ? String(d.line) : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  return [
    marketName,
    d.pick,
    d.line !== null && d.line !== undefined ? String(d.line) : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export interface CleanSelectionDetailForApi {
  sport: 'Fútbol' | 'Béisbol' | 'Americano' | 'Básquetbol';
  market: 'Goles' | 'Córners' | 'Tarjetas' | 'Carreras' | 'Puntos' | 'ML' | 'Hándicap asiático' | 'Hándicap' | 'Ambos anotan' | 'Triples' | 'Rebotes' | 'Asistencias' | 'Yardas' | 'Ponches' | 'Hits' | 'Otro';
  pick: string;
  line: number | null;
  description: string;
  game_id: string;
  event_label: string;
  prediction_id?: number | null;
}

export function toDatabaseSelectionDetail(
  d: SelectionDetail,
  linkedGames?: { id: string; sport?: string }[]
): CleanSelectionDetailForApi {
  let rawSport = d.sport || 'Fútbol';
  if (d.game_id && linkedGames && linkedGames.length > 0) {
    const matched = linkedGames.find((g) => g.id === d.game_id);
    if (matched?.sport) {
      rawSport = matched.sport;
    }
  }

  const sLower = (rawSport || '').toLowerCase().trim();
  let sport: 'Fútbol' | 'Béisbol' | 'Americano' | 'Básquetbol' = 'Fútbol';
  if (sLower.includes('baloncest') || sLower.includes('básquet') || sLower.includes('basquet') || sLower === 'nba') {
    sport = 'Básquetbol';
  } else if (sLower.includes('american') || sLower === 'nfl') {
    sport = 'Americano';
  } else if (sLower.includes('béisbol') || sLower.includes('beisbol') || sLower === 'mlb' || sLower === 'kbo') {
    sport = 'Béisbol';
  } else {
    sport = 'Fútbol';
  }

  const mRaw = (d.market || '').toLowerCase().trim();
  const pickRaw = (d.pick || '').toLowerCase().trim();
  const rawLine = d.line !== undefined && d.line !== null ? Number(d.line) : null;

  let market: 'Goles' | 'Córners' | 'Tarjetas' | 'Carreras' | 'Puntos' | 'ML' | 'Hándicap asiático' | 'Hándicap' | 'Ambos anotan' | 'Triples' | 'Rebotes' | 'Asistencias' | 'Yardas' | 'Ponches' | 'Hits' | 'Otro' = 'Otro';
  let pick = d.pick || 'Local';
  let line = rawLine;
  let description = '';

  if (sport === 'Básquetbol') {
    if (mRaw.includes('tripl')) {
      market = 'Triples';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 2.5;
    } else if (mRaw.includes('rebot')) {
      market = 'Rebotes';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 7.5;
    } else if (mRaw.includes('asist')) {
      market = 'Asistencias';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 6.5;
    } else if (mRaw.includes('punt') && !mRaw.includes('hándicap') && !mRaw.includes('handicap') && !mRaw.includes('spread')) {
      market = 'Puntos';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 24.5;
    } else if (mRaw.includes('hándicap') || mRaw.includes('handicap') || mRaw.includes('spread')) {
      market = 'Hándicap';
      pick = pickRaw.includes('vis') ? 'Visitante' : 'Local';
      line = line != null ? line : 0;
    } else if (mRaw === 'ml' || mRaw.includes('moneyline') || mRaw.includes('ganad') || mRaw.includes('victor')) {
      market = 'ML';
      pick = pickRaw.includes('vis') ? 'Visitante' : 'Local';
      line = null;
    } else {
      market = 'Otro';
      description = (d.description || d.market || d.pick || 'Mercado NBA').slice(0, 200);
      if (description.trim().length < 3) description = 'Mercado NBA';
      pick = d.pick || 'Selección';
    }
  } else if (sport === 'Americano') {
    if (mRaw.includes('yard')) {
      market = 'Yardas';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 64.5;
    } else if (mRaw.includes('punt') && !mRaw.includes('hándicap') && !mRaw.includes('handicap') && !mRaw.includes('spread')) {
      market = 'Puntos';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 45.5;
    } else if (mRaw.includes('hándicap') || mRaw.includes('handicap') || mRaw.includes('spread')) {
      market = 'Hándicap';
      pick = pickRaw.includes('vis') ? 'Visitante' : 'Local';
      line = line != null ? line : 0;
    } else if (mRaw === 'ml' || mRaw.includes('moneyline') || mRaw.includes('ganad') || mRaw.includes('victor')) {
      market = 'ML';
      pick = pickRaw.includes('vis') ? 'Visitante' : 'Local';
      line = null;
    } else {
      market = 'Otro';
      description = (d.description || d.market || d.pick || 'Mercado NFL').slice(0, 200);
      if (description.trim().length < 3) description = 'Mercado NFL';
      pick = d.pick || 'Selección';
    }
  } else if (sport === 'Béisbol') {
    if (mRaw.includes('ponch') || mRaw.includes('strikeout')) {
      market = 'Ponches';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 5.5;
    } else if (mRaw.includes('hit')) {
      market = 'Hits';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 1.5;
    } else if (mRaw.includes('carrer') && !mRaw.includes('run line') && !mRaw.includes('hándicap')) {
      market = 'Carreras';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 8.5;
    } else if (mRaw.includes('run line') || mRaw.includes('hándicap') || mRaw.includes('handicap')) {
      market = 'Hándicap';
      pick = pickRaw.includes('vis') ? 'Visitante' : 'Local';
      line = line != null ? line : 0;
    } else if (mRaw === 'ml' || mRaw.includes('moneyline') || mRaw.includes('ganad') || mRaw.includes('victor')) {
      market = 'ML';
      pick = pickRaw.includes('vis') ? 'Visitante' : 'Local';
      line = null;
    } else {
      market = 'Otro';
      description = (d.description || d.market || d.pick || 'Mercado MLB').slice(0, 200);
      if (description.trim().length < 3) description = 'Mercado MLB';
      pick = d.pick || 'Selección';
    }
  } else {
    // Fútbol
    if (mRaw.includes('ambos') || mRaw.includes('btts')) {
      market = 'Ambos anotan';
      pick = pickRaw.includes('no') ? 'No' : 'Sí';
      line = null;
    } else if (mRaw.includes('córner') || mRaw.includes('corner')) {
      market = 'Córners';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 9.5;
    } else if (mRaw.includes('tarjet') || mRaw.includes('card')) {
      market = 'Tarjetas';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 3.5;
    } else if (mRaw.includes('gol') && !mRaw.includes('goleador')) {
      market = 'Goles';
      pick = pickRaw.includes('men') || pickRaw.includes('under') ? 'Menos de' : 'Más de';
      line = line != null && line >= 0 ? line : 2.5;
    } else if (mRaw.includes('asiátic') || mRaw.includes('asiatico')) {
      market = 'Hándicap asiático';
      pick = pickRaw.includes('vis') ? 'Visitante' : 'Local';
      line = line != null ? line : 0;
    } else if (mRaw.includes('hándicap') || mRaw.includes('handicap')) {
      market = 'Hándicap';
      pick = pickRaw.includes('vis') ? 'Visitante' : 'Local';
      line = line != null ? line : 0;
    } else if (mRaw === 'ml' || mRaw.includes('moneyline') || mRaw.includes('ganad') || mRaw.includes('victor') || mRaw.includes('1x2')) {
      market = 'ML';
      pick = pickRaw.includes('emp') || pickRaw.includes('draw') ? 'Empate' : pickRaw.includes('vis') ? 'Visitante' : 'Local';
      line = null;
    } else {
      market = 'Otro';
      description = (d.description || d.market || d.pick || 'Mercado fútbol').slice(0, 200);
      if (description.trim().length < 3) description = 'Mercado fútbol';
      pick = d.pick || 'Selección';
    }
  }

  // Backend strict rule: description MUST be empty if market != 'Otro'
  if (market !== 'Otro') {
    description = '';
  }

  return {
    sport,
    market,
    pick,
    line,
    description,
    game_id: d.game_id || '',
    event_label: (d.event_label || '').slice(0, 120),
    prediction_id: d.prediction_id ? Number(d.prediction_id) : undefined,
  };
}
