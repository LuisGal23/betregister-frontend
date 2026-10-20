import type { Currency } from '../../../shared/models/currency.model';
export interface Credentials {
  terms_accepted?: boolean;
  age_confirmed?: boolean;
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
  sports_enabled?: boolean;
  units?: UnitPreferences | null;
  timezone?: string;
  email: string;
  display_currency: Currency;
  manual_rate: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  telegram?: string | null;
  twitter?: string | null;
  favorite_sports?: string[];
  is_tipster?: boolean;
  public_profile_enabled?: boolean;
  show_bank_units?: boolean;
}
