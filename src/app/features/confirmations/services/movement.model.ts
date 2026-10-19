import type { Currency } from '../../../shared/models/currency.model';
export type MovementKind = 'deposit' | 'withdrawal' | 'bonus' | 'fee' | 'tax';
export type MovementStatus = 'pending' | 'confirmed' | 'cancelled';
export interface Movement {
  id: number;
  house_id: number;
  house: string;
  currency: Currency;
  kind: MovementKind;
  amount: number;
  status: MovementStatus;
  created: string;
  confirmed_at: string | null;
}
export interface CreateMovement {
  house_id: number;
  kind: MovementKind;
  amount: number;
}
