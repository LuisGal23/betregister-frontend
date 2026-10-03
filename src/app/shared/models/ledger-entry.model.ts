import type { Currency } from './currency.model';
export interface LedgerEntry {
  id: number;
  house_id: number;
  amount: number;
  kind: string;
  source_id: number | null;
  profit: number;
  exposure: number;
  cost: number;
  note: string;
  created: string;
  currency: Currency;
  archived: number;
}
