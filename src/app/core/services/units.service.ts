import { Injectable, inject } from '@angular/core';
import { LedgerState } from './ledger-state.service';
import { unitAmount } from '../../shared/utils/units.utils';
import type { Currency } from '../../shared/models/currency.model';
@Injectable({ providedIn: 'root' })
export class UnitsService {
  vm = inject(LedgerState);
  value(currency: Currency) {
    return unitAmount(
      this.vm.data().profile.units,
      currency,
      this.vm.data().houses,
      this.vm.rate(),
    );
  }
}
