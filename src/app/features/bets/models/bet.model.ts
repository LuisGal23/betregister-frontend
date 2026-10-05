import type { SelectionDetail } from './selection-detail';
import type { Currency } from '../../../shared/models/currency.model';
import type { GameReference } from '../../sports/models/sports.model';
export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'cashout';
export type BetResult = Exclude<BetStatus, 'pending'>;
export interface BetLeg {
  selection: string;
  odds: number | string;
  status: 'pending' | 'won' | 'lost' | 'void';
}
export interface Bet {
  closing_odds?: string | null;
  american_odds?: number | null;
  league_tag?: string;
  sport_tag?: string;
  market_tag?: string;
  linked_games?: GameReference[];
  history_hidden?: number;
  legs?: BetLeg[];
  remaining_stake?: number;
  partial_payout?: number;
  released_stake?: number;
  revision?: number;
  id: number;
  house_id: number;
  house: string;
  currency: Currency;
  event: string;
  odds: string;
  stake: number;
  selection_details?: SelectionDetail[];
  same_game_selections?: string[];
  bet_type?: 'simple' | 'parlay' | 'same_game';
  bonus?: number;
  payout: number;
  status: BetStatus;
  created: string;
  settled_at: string | null;
}
export interface CreateBet {
  challenge_id?: number;
  odds_format?: 'decimal' | 'american';
  league_tag?: string;
  market_tag?: string;
  games?: string[];
  legs?: BetLeg[];
  house_id: number;
  event: string;
  odds: number;
  stake: number;
  selection_details?: SelectionDetail[];
  same_game_selections?: string[];
  bet_type?: 'simple' | 'parlay' | 'same_game';
  bonus?: number;
}
