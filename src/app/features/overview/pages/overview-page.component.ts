import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MoneyDialogComponent } from '../components/money-dialog/money-dialog.component';
import { SportEfficiencyComponent } from '../components/sport-efficiency/sport-efficiency.component';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LedgerState } from '../../../core/services/ledger-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { OverviewService } from '../services/overview.service';
import { ChartsComponent } from '../components/charts/charts.component';
@Component({
  selector: 'app-overview-page',
  imports: [
    MoneyDialogComponent,
    RouterLink,
    IconComponent,
    ChartsComponent,
    SportEfficiencyComponent,
  ],
  templateUrl: './overview-page.component.html',
  styleUrl: './overview-page.component.css',
})
export class OverviewPageComponent {
  router = inject(Router);
  route = inject(ActivatedRoute);
  money = signal('');
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
  overview = inject(OverviewService);
}
