import type { Currency } from '../../../shared/models/currency.model';
export interface Credentials {
  email: string;
  password: string;
}
export interface UnitPreferences {
  mode: 'fixed' | 'percent';
  value: number | string;
  currency: Currency;
  dynamic: boolean;
  base?: Partial<Record<Currency, number>>;
}
export interface Profile {
  units?: UnitPreferences | null;
  timezone?: string;
  email: string;
  display_currency: Currency;
  manual_rate: string | null;
}
