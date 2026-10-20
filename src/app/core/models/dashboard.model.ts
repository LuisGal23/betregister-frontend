import type { House } from '../../features/banco/services/house.model';
import type { Bet } from '../../features/apuestas/services/bet.model';
import type { Movement } from '../../features/confirmations/services/movement.model';
import type { Profile } from '../../features/auth/services/auth.model';
import type { LedgerEntry } from '../../shared/models/ledger-entry.model';
export interface Dashboard {
  ledger?: LedgerEntry[];
  houses: House[];
  bets: Bet[];
  movements: Movement[];
  profile: Profile;
}
export const emptyDashboard = (): Dashboard => ({
  houses: [],
  bets: [],
  movements: [],
  profile: { email: '', display_currency: 'MXN', manual_rate: null },
});
