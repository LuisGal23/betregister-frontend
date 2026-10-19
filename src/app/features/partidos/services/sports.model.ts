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
}

export interface TeamStat {
  name: string;
  home: string;
  away: string;
}

export interface MatchDetails {
  id: string;
  league: string;
  sport: string;
  summary: SportsGame;
  odds?: MatchOdds | null;
  probabilities?: MatchProbabilities | null;
  players: PlayerStat[];
  team_stats: TeamStat[];
  stale?: boolean;
  message?: string;
}
