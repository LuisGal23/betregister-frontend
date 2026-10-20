export interface GameReference {
  id: string;
  league: string;
  league_name: string;
  sport: string;
  start: string;
  home_logo?: string | null;
  away_logo?: string | null;
  home_color?: string | null;
  away_color?: string | null;
  home: string;
  away: string;
  venue?: string;
  home_id?: string;
  away_id?: string;
  provider: string;
}
export interface SportsGame extends GameReference {
  home_score: string | null;
  away_score: string | null;
  state: 'scheduled' | 'live' | 'final' | 'postponed' | 'unknown';
  detail: string;
  updated_at?: string | null;
  stale?: boolean;
  message?: string;
  home_record?: string;
  away_record?: string;
}
export interface League { id: string; sport: string; name: string; source: string; configured: boolean }
export interface Scoreboard {
  league: string; date: string; timezone: string; events: SportsGame[];
  source: string; updated_at: string | null; stale: boolean; message: string;
  configured: boolean; refresh_seconds: number;
}
export interface BetScores { events: SportsGame[]; messages: string[]; refresh_seconds: number }

export interface MoneylineOdds {
  home_american?: number | string | null;
  home_decimal?: number | null;
  away_american?: number | string | null;
  away_decimal?: number | null;
  draw_american?: number | string | null;
  draw_decimal?: number | null;
}

export interface SpreadOdds {
  home_line?: number | string | null;
  home_american?: number | string | null;
  home_decimal?: number | null;
  away_line?: number | string | null;
  away_american?: number | string | null;
  away_decimal?: number | null;
}

export interface TotalOdds {
  line?: number | string | null;
  over_american?: number | string | null;
  over_decimal?: number | null;
  under_american?: number | string | null;
  under_decimal?: number | null;
}

export interface MatchOdds {
  provider: string;
  details?: string | null;
  moneyline: MoneylineOdds;
  spread: SpreadOdds;
  total: TotalOdds;
}

export interface MatchProbabilities {
  home_pct: number;
  away_pct: number;
  draw_pct?: number | null;
  source: string;
}

export interface PlayerStat {
  team_side: 'home' | 'away';
  team_name: string;
  athlete_id?: string | null;
  name: string;
  jersey?: string | null;
  position?: string | null;
  headshot?: string | null;
  category: string;
  category_label: string;
  display_stat: string;
  stats?: Record<string, any>;
  prob?: number;
  line?: number;
  odds?: number;
}

export interface TeamStat {
  name: string;
  home: string;
  away: string;
}

export interface StarPlayerAnalysis {
  name: string;
  team: string;
  team_side: 'home' | 'away';
  role: string;
  position?: string;
  headshot?: string;
  athlete_id?: string;
  jersey?: number | string;
  marginImpact: string;
  priorStarts: number;
  statusText: string;
}

export interface InjuryReportItem {
  name: string;
  team: string;
  team_side: 'home' | 'away';
  position: string;
  status: 'Fuera (Out)' | 'Cuestionable (Questionable)' | 'Duda (Doubtful)' | 'Baja Confirmada';
  reason: string;
  impact: 'Alto' | 'Medio' | 'Leve';
}

export interface H2HMatch {
  date: string;
  home: string;
  away: string;
  score: string;
  winner: string;
  competition: string;
  home_score?: number | null;
  away_score?: number | null;
  home_logo?: string | null;
  away_logo?: string | null;
}

export interface TeamFormMatch {
  date: string;
  opponent: string;
  result: 'W' | 'D' | 'L';
  score: string;
  isHome: boolean;
  opponentLogo?: string | null;
  competition?: string;
  goalsFor?: number;
  goalsAgainst?: number;
}

export interface AlternativeLineItem {
  label: string;
  category: string;
  prob: number;
  status: string;
  odds: number;
}

export interface OddsByBookmaker {
  bookmaker: string;
  homeOdds: number;
  drawOdds?: number | null;
  awayOdds: number;
  overOdds?: number;
  underOdds?: number;
  /** Línea de total (over/under) publicada por la casa */
  totalLine?: number | null;
  /** Hándicap del local publicado por la casa */
  spreadLine?: number | null;
  /** true = cuota real publicada por la casa (ESPN pickcenter); false = estimación del modelo */
  verified?: boolean;
}

/** Resumen de la serie cara a cara (ESPN seasonseries) */
export interface H2HSummary {
  title: string;
  summary: string;
  description?: string;
  homeWins: number;
  awayWins: number;
  draws: number;
  total: number;
}

/** Una prop calculada con el game log real del jugador */
export interface PlayerPropLine {
  key: string;
  label: string;
  /** Texto principal, ej. "1+" o "200+" */
  target: string;
  line: number;
  /** Probabilidad (0-100) basada en tasa de acierto real de los últimos partidos */
  prob: number;
  hits: number;
  games: number;
  avg: number;
  market: string;
}

export interface PlayerGameLogEntry {
  date: string;
  opponent: string;
  opponentLogo?: string | null;
  atVs: string;
  result: string;
  score: string;
  stats: Record<string, number>;
}

/** Tarjeta de jugador con props reales (estilo carta) */
export interface PlayerPropCard {
  athlete_id: string;
  name: string;
  team_name: string;
  team_side: 'home' | 'away';
  team_abbr: string;
  team_logo?: string | null;
  position: string;
  group: string;
  jersey?: string | null;
  photo?: string | null;
  /** true si la foto es un recorte sin fondo (cutout) */
  cutout?: boolean;
  props: PlayerPropLine[];
  gamelog: PlayerGameLogEntry[];
  seasonLine?: string;
}

/** Resultado del modelo estadístico (Poisson / Normal) construido con datos reales */
export interface MatchModel {
  method: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  expectedHome: number;
  expectedAway: number;
  expectedTotal: number;
  totalLine: number;
  overProb: number;
  underProb: number;
  bttsProb?: number | null;
  likelyScore: string;
  topScores: { score: string; prob: number }[];
  totalsDistribution: { label: string; prob: number }[];
  homeForm: TeamFormStats;
  awayForm: TeamFormStats;
}

export interface TeamFormStats {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  scoredAvg: number;
  concededAvg: number;
  points: number;
}

export interface ManagerDuel {
  home_manager: string;
  away_manager: string;
  home_photo?: string | null;
  away_photo?: string | null;
  home_wins: number;
  away_wins: number;
  draws: number;
  summary_text?: string;
}

export interface PreMatchStanding {
  position: number;
  team: string;
  form: ('W' | 'D' | 'L')[];
  rating: number; // e.g. 7.39
  points: number;
}

export interface TrophyComparison {
  competition_name: string;
  home_trophies: number;
  away_trophies: number;
}

export interface BroadcastChannel {
  name: string;
  network: string;
  region: string;
  votes?: number;
  status?: string;
}

export interface ValueBetAnalysis {
  partido: string;
  mercado_recomendado: string;
  seleccion: string;
  cuota_objetivo: number;
  bookmaker_cuota: string;
  probabilidad_implicita_casino: number; // (1 / cuota) * 100
  probabilidad_estimada_ia: number; // e.g. 58.5%
  edge_ev: number; // probabilidad_estimada_ia - probabilidad_implicita_casino
  is_value_bet: boolean; // edge_ev >= 2.0%
  nivel_confianza: 1 | 2 | 3 | 4 | 5;
  stake_sugerido_porcentaje: number; // Criterio Kelly fraccional (1.0% - 5.0%)
  justificacion_tactica: string;
  super_contexto: {
    cuotas: {
      pinnacle?: number;
      bet365?: number;
      caliente?: number;
      mercado: string;
    };
    forma_reciente: {
      local: string;
      visita: string;
    };
    h2h_reciente: string;
    lesiones_clave: { jugador: string; equipo: string; estado: string; impacto: string }[];
  };
}

export interface AIValueBetResponse {
  recommended_market: string;
  target_odd: number;
  bookmaker: string;
  implicit_probability_pct: number;
  ai_estimated_probability_pct: number;
  expected_value_pct: number;
  is_value_bet: boolean;
  confidence_level: 1 | 2 | 3 | 4 | 5;
  suggested_stake_pct: number;
  tactical_reasoning: string;
  _cached?: boolean;
  _cache_age_seconds?: number;
}

export interface MatchDetails {
  id: string;
  league: string;
  sport: string;
  summary: SportsGame;
  venue?: string;
  odds?: MatchOdds | null;
  probabilities?: MatchProbabilities | null;
  players: PlayerStat[];
  team_stats: TeamStat[];
  star_players?: StarPlayerAnalysis[];
  injuries?: InjuryReportItem[];
  h2h?: H2HMatch[];
  h2h_summary?: H2HSummary | null;
  recent_form_home?: TeamFormMatch[];
  recent_form_away?: TeamFormMatch[];
  manager_duel?: ManagerDuel;
  pre_match_standings?: PreMatchStanding[];
  trophies?: TrophyComparison;
  broadcasts?: BroadcastChannel[];
  alternative_lines?: AlternativeLineItem[];
  bookmakers_odds?: OddsByBookmaker[];
  player_prop_cards?: PlayerPropCard[];
  match_model?: MatchModel | null;
  value_bet?: ValueBetAnalysis | null;
  ai_value_bet?: AIValueBetResponse | null;
  home_record?: string;
  away_record?: string;
  home_id?: string;
  away_id?: string;
  home_abbr?: string;
  away_abbr?: string;
  /** Líderes de la temporada por equipo (id de atleta) para cargar game logs */
  key_athletes?: { id: string; name: string; side: 'home' | 'away'; position?: string; jersey?: string; headshot?: string | null; seasonLine?: string }[];
  /** Fuente real de los datos y momento de actualización */
  data_source?: string;
  updated_at?: string;
  odds_verified?: boolean;
  stale?: boolean;
  message?: string;
}
