import { Injectable, computed, inject } from '@angular/core';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { DistributionItem } from './overview.model';
@Injectable({ providedIn: 'root' })
export class OverviewService {
  private state = inject(LedgerState);
  recentBets = computed(() => this.state.data().bets.filter(b => !b.history_hidden).slice(0, 5));
  distribution = computed<DistributionItem[] | null>(() => {
    const houses = this.state.data().houses.map((h) => ({
      ...h,
      value: this.state.converted(h.balance + h.pending, h.currency),
    }));
    if (houses.some((h) => h.value === null)) return null;
    const total = houses.reduce((sum, h) => sum + (h.value ?? 0), 0);
    return houses.map((h) => ({ ...h, percent: total ? ((h.value ?? 0) / total) * 100 : 0 }));
  });
}
