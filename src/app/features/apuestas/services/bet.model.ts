import type { SelectionDetail } from './selection-detail';
import type { Currency } from '../../../shared/models/currency.model';
import type { GameReference } from '../../partidos/services/sports.model';
export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'cashout';
export type BetResult = Exclude<BetStatus, 'pending'>;
export interface BetLeg {
  selection: string;
  odds: number | string;
  status: 'pending' | 'won' | 'lost' | 'void';
  prediction_id?: number | null;
}
export interface Bet {
  public_record?: boolean;
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
  prediction_id?: number | null;
  bonus?: number;
  payout: number;
  status: BetStatus;
  created: string;
  settled_at: string | null;
}
export interface CreateBet {
  public_record?: boolean;
  event_start?: string;
  challenge_id?: number;
  prediction_id?: number | null;
  odds_format?: 'decimal' | 'american';
  league_tag?: string;
  market_tag?: string;
  games?: string[];
  linked_games?: GameReference[];
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
