import { zoneDay } from '../../../shared/utils/zone.utils';
import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

import { computed, signal } from '@angular/core';
import { TransactionsService } from '../services/transactions.service';
import type { TransactionFilter } from '../models/transaction-filter.model';
import { timestamp } from '../../../shared/utils/date.utils';
@Component({
  selector: 'app-transactions-page',
  imports: [FormsModule, DatePipe, IconComponent],
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.css',
})
export class TransactionsPageComponent {
  vm = inject(LedgerState);
  readonly Math = Math;

  transactions = inject(TransactionsService);
  tabs: { value: TransactionFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'deposit', label: 'Depósitos' },
    { value: 'withdrawal', label: 'Retiros' },
    { value: 'bonus', label: 'Bonos' },
    { value: 'fee', label: 'Comisiones' },
    { value: 'tax', label: 'Impuestos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'confirmed', label: 'Confirmados' },
    { value: 'cancelled', label: 'Cancelados' },
  ];
  movementFilter = signal<TransactionFilter>('all');
  search = signal('');
  house = signal('');
  from = signal('');
  until = signal('');
  timestamp = timestamp;
  filteredMovements = computed(() =>
    this.transactions.filter(this.movementFilter(), this.search()).filter((m) => {
      const date = zoneDay(m.created, this.vm.data().profile.timezone);
      return (
        (!this.house() || String(m.house_id) === this.house()) &&
        (!this.from() || date >= this.from()) &&
        (!this.until() || date <= this.until())
      );
    }),
  );
}
