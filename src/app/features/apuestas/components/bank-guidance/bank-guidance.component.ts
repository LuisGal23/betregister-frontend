import { Component, computed, inject, input } from '@angular/core';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { stakeRisk } from '../../../../shared/utils/risk.utils';
import { zoneDay } from '../../../../shared/utils/zone.utils';

@Component({
  selector: 'app-bank-guidance',
  templateUrl: './bank-guidance.component.html',
})
export class BankGuidanceComponent {
  readonly Math = Math;
  vm = inject(LedgerState);
  houseId = input.required<string>();
  stake = input<number | null>(null);
  house = computed(() => this.vm.data().houses.find((h) => String(h.id) === this.houseId()));
  amount = computed(() => Math.max(0, Number(this.stake()) || 0));
  risk = computed(() => stakeRisk(this.amount(), (this.house()?.balance ?? 0) / 100));
  maximum = computed(() => Math.floor((this.house()?.balance ?? 0) / 50));
  overReference = computed(() => Math.round(this.amount() * 100) > this.maximum());
  general = computed(() => {
    const h = this.house(),
      available = this.vm.total('balance'),
      pending = this.vm.total('pending');
    if (!h || available === null || pending === null || available + pending <= 0) return null;
    const stake = this.vm.converted(Math.round(this.amount() * 100), h.currency);
    return stake === null ? null : (stake / (available + pending)) * 100;
  });
  exposure = computed(() => {
    const h = this.house();
    if (!h || h.balance + h.pending <= 0) return null;
    const today = zoneDay(new Date().toISOString(), this.vm.data().profile.timezone);
    const openToday = this.vm
      .data()
      .bets.filter(
        (b) =>
          b.house_id === h.id &&
          b.status === 'pending' &&
          zoneDay(b.created, this.vm.data().profile.timezone) === today,
      )
      .reduce((sum, b) => sum + (b.remaining_stake ?? b.stake), 0);
    const proposed = Math.round(this.amount() * 100);
    return {
      today: ((openToday + proposed) / (h.balance + h.pending)) * 100,
      total: ((h.pending + proposed) / (h.balance + h.pending)) * 100,
    };
  });
  percent(value: number | null) {
    return value === null ? '—' : value.toFixed(2) + '%';
  }
}
