import { AdvancedAnalysisComponent } from '../components/advanced-analysis/advanced-analysis.component';
import { insightCategories } from '../models/market-insights';
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InsightsService } from '../services/insights.service';
import { MARKET_TAGS, marketLabel } from '../../bets/models/bet-tags';
import { timestamp } from '../../../shared/utils/date.utils';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-insights-page',
  standalone: true,
  imports: [CommonModule, AdvancedAnalysisComponent, FormsModule, RouterLink, DatePipe, IconComponent],
  templateUrl: './insights-page.component.html',
  host: { class: 'block space-y-6 max-w-[1440px] mx-auto px-3 sm:px-6 py-4' },
})
export class InsightsPageComponent {
  tab = signal<'efficiency' | 'odds' | 'patterns' | 'clv'>('efficiency');
  insights = inject(InsightsService);
  vm = this.insights.vm;

  sports = ['', 'Fútbol', 'Béisbol', 'Americano', 'Mixto', 'Otro', 'Sin clasificar'];

  markets = computed(() =>
    [
      ...new Set(
        this.vm
          .data()
          .bets.filter(
            (b) =>
              this.insights.includeArchived() ||
              this.vm.data().houses.some((h) => h.id === b.house_id),
          )
          .flatMap((b) => insightCategories(b))
          .filter((d) => !this.insights.sport() || d.sport === this.insights.sport())
          .map((d) => d.market),
      ),
    ].sort(),
  );

  constructor() {
    this.insights.sport.set('');
    this.insights.market.set('');
    this.insights.type.set('');
  }

  chooseSport(value: string) {
    this.insights.sport.set(value);
    this.insights.market.set('');
    this.selected.set(null);
  }

  chooseMode(value: 'market' | 'type') {
    this.insights.mode.set(value);
    this.insights.market.set('');
    this.insights.type.set('');
    this.selected.set(null);
  }

  Math = Math;
  marketTags = MARKET_TAGS;
  marketLabel = marketLabel;
  timestamp = timestamp;
  selected = signal<string | null>(null);

  pending = computed(() => this.insights.bets().filter((b) => b.status === 'pending').length);

  barMax = computed(() => Math.max(1, ...this.insights.rows().map((g) => Math.abs(g.profit ?? 0))));

  overallStats = computed(() => {
    const bets = this.insights.bets().filter((b) => ['won', 'lost', 'cashout'].includes(b.status));
    let net = 0;
    let staked = 0;
    let won = 0;
    let lost = 0;

    for (const b of bets) {
      const s = this.vm.converted(b.stake, b.currency as any);
      const p = this.vm.converted(b.payout - b.stake, b.currency as any);
      if (s !== null) staked += s;
      if (p !== null) net += p;
      if (b.status === 'won') won++;
      if (b.status === 'lost') lost++;
    }

    const decisive = won + lost;
    return {
      totalTickets: this.insights.total(),
      closedTickets: bets.length,
      pendingTickets: this.pending(),
      totalProfit: net,
      totalStaked: staked,
      overallYield: staked > 0 ? (net / staked) * 100 : null,
      winRate: decisive > 0 ? (won / decisive) * 100 : null,
      won,
      lost,
    };
  });

  winningRows = computed(() =>
    this.insights
      .rows()
      .filter((r) => (r.profit ?? 0) > 0)
      .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0)),
  );

  losingRows = computed(() =>
    this.insights
      .rows()
      .filter((r) => (r.profit ?? 0) < 0)
      .sort((a, b) => (a.profit ?? 0) - (b.profit ?? 0)),
  );

  neutralRows = computed(() =>
    this.insights.rows().filter((r) => (r.profit ?? 0) === 0 && r.closed > 0),
  );

  bestMarket = computed(() => this.insights.ranked().best);
  worstMarket = computed(() => this.insights.ranked().worst);

  // Performance by bet type: Simples vs Parlays vs Same Game
  typeComparison = computed(() => {
    const bets = this.insights.bets().filter((b) => ['won', 'lost', 'cashout'].includes(b.status));
    const types = [
      { id: 'simple', label: 'Apuestas Simples', icon: 'bets' },
      { id: 'parlay', label: 'Parlays / Combinadas', icon: 'trend' },
      { id: 'same_game', label: 'Mismo Partido (SGP)', icon: 'flag' },
    ];

    return types.map((t) => {
      const subset = bets.filter((b) => (b.bet_type ?? 'simple') === t.id);
      let staked = 0;
      let profit = 0;
      let won = 0;
      let lost = 0;

      for (const b of subset) {
        const s = this.vm.converted(b.stake, b.currency as any) ?? 0;
        const p = this.vm.converted(b.payout - b.stake, b.currency as any) ?? 0;
        staked += s;
        profit += p;
        if (b.status === 'won') won++;
        if (b.status === 'lost') lost++;
      }

      const decisive = won + lost;
      return {
        id: t.id,
        label: t.label,
        icon: t.icon,
        count: subset.length,
        won,
        lost,
        winRate: decisive > 0 ? (won / decisive) * 100 : null,
        profit,
        yield: staked > 0 ? (profit / staked) * 100 : null,
      };
    });
  });

  detail = computed(() => this.insights.groups().find((g) => g.key === this.selected()) ?? null);

  detailTickets = computed(() =>
    [...(this.detail()?.tickets ?? [])]
      .sort((a, b) => b.created.localeCompare(a.created))
      .slice(0, 15),
  );

  sportLabel(value: string) {
    return value === 'Americano' ? 'NFL' : value || 'Todos los deportes';
  }

  typeLabel(type: string) {
    return type === 'all'
      ? 'Todos los tipos'
      : type === 'same_game'
        ? 'Mismo partido'
        : type === 'parlay'
          ? 'Parlay'
          : 'Simple';
  }

  percent(value: number | null) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return (value > 0 ? '+' : '') + value.toFixed(1) + '%';
  }

  async refresh() {
    await this.vm.run(() => this.vm.refresh());
  }
}
