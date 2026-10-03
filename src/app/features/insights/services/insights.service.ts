import { Injectable, computed, inject, signal } from '@angular/core';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { Currency } from '../../../shared/models/currency.model';
import { groupMarkets, rankedMarkets, matchesInsightTags } from '../models/market-insights';
@Injectable({ providedIn: 'root' })
export class InsightsService {
  vm = inject(LedgerState);
  mode = signal<'market' | 'type'>('market');
  sport = signal('');
  type = signal('');
  market = signal('');
  includeArchived = signal(false);
  sort = signal<'profit' | 'frequency' | 'yield'>('profit');
  bets = computed(() => {
    const active = new Set(this.vm.data().houses.map((h) => h.id));
    return this.vm
      .data()
      .bets.filter(
        (b) =>
          (this.includeArchived() || active.has(b.house_id)) &&
          (!this.type() || (b.bet_type ?? 'simple') === this.type()) &&
          matchesInsightTags(b, this.sport(), this.market()),
      );
  });
  groups = computed(() =>
    groupMarkets(
      this.bets(),
      (minor, currency) => this.vm.converted(minor, currency as Currency),
      this.mode(),
    ).filter(
      (g) =>
        this.mode() === 'type' ||
        ((!this.sport() || g.sport === this.sport()) &&
          (!this.market() || g.market === this.market())),
    ),
  );
  ranked = computed(() => rankedMarkets(this.groups()));
  rows = computed(() =>
    [...this.groups()].sort((a, b) =>
      this.sort() === 'frequency'
        ? b.total - a.total
        : this.sort() === 'yield'
          ? (b.yield ?? -Infinity) - (a.yield ?? -Infinity)
          : (b.profit ?? -Infinity) - (a.profit ?? -Infinity),
    ),
  );
  total = computed(() => this.bets().length);
  closed = computed(
    () => this.bets().filter((b) => ['won', 'lost', 'cashout'].includes(b.status)).length,
  );
  missingRate = computed(() => this.groups().some((g) => g.profit === null));
  unclassified = computed(
    () =>
      this.bets().filter(
        (b) =>
          !b.selection_details?.length &&
          (!b.market_tag || ['Sin clasificar', 'Over', 'Under'].includes(b.market_tag)),
      ).length,
  );
}
