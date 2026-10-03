import { Injectable, inject } from '@angular/core';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { MovementKind } from '../../confirmations/models/movement.model';
import type { TransactionFilter } from '../models/transaction-filter.model';
@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private state = inject(LedgerState);
  filter(filter: TransactionFilter, search: string) {
    return this.state
      .data()
      .movements.filter(
        (m) =>
          (filter === 'all' || m.kind === filter || m.status === filter) &&
          m.house.toLowerCase().includes(search.toLowerCase()),
      );
  }
  confirmedTotal(kind: MovementKind) {
    let sum = 0;
    for (const m of this.state
      .data()
      .movements.filter((m) => m.status === 'confirmed' && m.kind === kind)) {
      const value = this.state.converted(Math.abs(m.amount), m.currency);
      if (value === null) return null;
      sum += value;
    }
    return sum;
  }
}
