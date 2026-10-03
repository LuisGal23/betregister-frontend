import { Component, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-bank-summary',
  imports: [DecimalPipe, DatePipe, RouterLink, IconComponent],
  templateUrl: './bank-summary.component.html',
  styleUrl: './bank-summary.component.css',
})
export class BankSummaryComponent {
  vm = inject(LedgerState);
  totalBank() {
    const balance = this.vm.total('balance'),
      pending = this.vm.total('pending');
    return balance === null || pending === null ? null : balance + pending;
  }
}
