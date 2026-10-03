import type { Currency } from '../../../shared/models/currency.model';
export interface Credentials {
  email: string;
  password: string;
}
export interface Profile {
  timezone?: string;
  email: string;
  display_currency: Currency;
  manual_rate: string | null;
}
