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
