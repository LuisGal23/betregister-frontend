import type { Currency } from '../../../shared/models/currency.model';
export interface House {
  month_profit?: number;
  month_loss_percent?: number | null;
  id: number;
  name: string;
  currency: Currency;
  balance: number;
  pending: number;
  profit: number;
}
export interface CreateHouse {
  name: string;
  currency: Currency;
}
export interface Preferences {
  display_currency: Currency;
  manual_rate: number | null;
}
