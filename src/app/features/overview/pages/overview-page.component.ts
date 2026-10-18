import { BetScoresComponent } from '../../sports/components/bet-scores/bet-scores.component';
import type { Bet } from '../../bets/models/bet.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MoneyDialogComponent } from '../components/money-dialog/money-dialog.component';
import { SportEfficiencyComponent } from '../components/sport-efficiency/sport-efficiency.component';
import { calculateMetrics } from '../../../shared/utils/metrics.utils';
import { zoneDay } from '../../../shared/utils/zone.utils';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LedgerState } from '../../../core/services/ledger-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { OverviewService } from '../services/overview.service';
import { ChartsComponent } from '../components/charts/charts.component';
import { TicketModalService } from '../../bets/services/ticket-modal.service';
@Component({
  selector: 'app-overview-page',
  imports: [
    MoneyDialogComponent,
    BetScoresComponent,
    RouterLink,
    IconComponent,
    ChartsComponent,
    SportEfficiencyComponent,
  ],
  templateUrl: './overview-page.component.html',
  host: { class: 'block space-y-6' },
})
export class OverviewPageComponent {
  router = inject(Router);
  route = inject(ActivatedRoute);
  ticketModal = inject(TicketModalService);
  money = signal('');
  scoreBet = signal<Bet | null>(null);
  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((p) => this.money.set(p.get('movements') ?? ''));
  }
  closeMoney() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { movements: null, kind: null, house: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
  vm = inject(LedgerState);
  readonly Math = Math;
  kpis = computed(() => {
    const entries = (this.vm.data().ledger ?? []).filter((e) => !e.archived);
    const converted = entries.map((e) => ({
      ...e,
      amount: this.vm.converted(e.amount, e.currency),
      profit: this.vm.converted(e.profit, e.currency),
      cost: this.vm.converted(e.cost, e.currency),
    }));
    const available = this.vm.total('balance'),
      pending = this.vm.total('pending');
    const month = zoneDay(new Date().toISOString(), this.vm.data().profile.timezone).slice(0, 7);
    const missing = converted.some(
      (e) => e.amount === null || e.profit === null || e.cost === null,
    );
    const metrics = missing
      ? null
      : calculateMetrics(
          converted.map((e) => ({ ...e, amount: e.amount!, profit: e.profit!, cost: e.cost! })),
          [],
        );
    return {
      bank: available === null || pending === null ? null : available + pending,
      yield: metrics?.yield ?? null,
      roi: metrics?.roi ?? null,
      month: missing
        ? null
        : converted
            .filter((e) => zoneDay(e.created, this.vm.data().profile.timezone).startsWith(month))
            .reduce((s, e) => s + e.profit!, 0),
    };
  });
  percent(v: number | null) {
    return v === null ? '—' : v.toFixed(1) + '%';
  }

  overview = inject(OverviewService);
}
