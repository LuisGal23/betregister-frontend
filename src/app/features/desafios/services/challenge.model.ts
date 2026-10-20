import type { Currency } from '../../../shared/models/currency.model';
export interface Challenge {
  rules?: {
    bet_type?: string;
    max_per_day?: number | null;
    min_odds?: string | null;
    max_odds?: string | null;
    max_stake?: string | null;
    sport?: string;
  };
  rules_note?: string;
  id: number;
  house_id: number;
  house: string;
  currency: Currency;
  title: string;
  kind: 'ladder' | 'target' | 'tracking';
  status: 'active' | 'paused' | 'completed' | 'archived';
  initial: number;
  target: number;
  steps: number;
  closed: number;
  profit: number;
  reference: number;
  pending: number;
  progress: number;
  bets: {
    id: number;
    event: string;
    stake: number;
    payout: number;
    status: string;
    linked_at: string;
  }[];
}
