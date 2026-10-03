import type { House } from '../../features/bank/models/house.model';
import type { Bet } from '../../features/bets/models/bet.model';
import type { Movement } from '../../features/confirmations/models/movement.model';
import type { Profile } from '../../features/auth/models/auth.model';
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
