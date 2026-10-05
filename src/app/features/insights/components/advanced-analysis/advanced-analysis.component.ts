import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { InsightsService } from '../../services/insights.service';
import type { Bet } from '../../../bets/models/bet.model';
import { insightCategories } from '../../models/market-insights';
@Component({
  selector: 'app-advanced-analysis',
  imports: [FormsModule],
  templateUrl: './advanced-analysis.component.html',
  styleUrl: './advanced-analysis.component.css',
})
export class AdvancedAnalysisComponent {
  mode = input('efficiency');
  service = inject(InsightsService);
  vm = this.service.vm;
  api = inject(ApiService);
  editing = signal<number | null>(null);
  closing: number | null = null;
  comparable = computed(() =>
    this.service.bets().filter((b) => (b.bet_type ?? 'simple') === 'simple'),
  );
  points = computed(() =>
    this.comparable()
      .filter((b) => Number(b.closing_odds) > 1)
      .map((b) => ({
        bet: b,
        x: Number(b.odds),
        y: Number(b.closing_odds),
        clv: (Number(b.odds) / Number(b.closing_odds) - 1) * 100,
      })),
  );
  extent = computed(() => Math.max(2, ...this.points().flatMap((p) => [p.x, p.y])));
  beaten = computed(() =>
    this.points().length
      ? (this.points().filter((p) => p.clv > 0).length / this.points().length) * 100
      : null,
  );
  coord(v: number) {
    return 35 + ((v - 1) / (this.extent() - 1)) * 330;
  }
  begin(b: Bet) {
    this.editing.set(b.id);
    this.closing = b.closing_odds ? Number(b.closing_odds) : null;
  }
  async save(id: number) {
    if (
      await this.vm.mutate(
        () => this.api.request(`/bets/${id}/closing-odds`, { odds: this.closing }),
        'Cuota de cierre guardada.',
      )
    )
      this.editing.set(null);
  }
  percent(v: number | null) {
    return v === null ? '—' : v.toFixed(1) + '%';
  }
  closed = computed(() =>
    this.service.bets().filter((b) => ['won', 'lost', 'cashout'].includes(b.status)),
  );
  summarize(bets: Bet[]) {
    const values = bets.map((b) => ({
      stake: this.vm.converted(b.stake, b.currency),
      profit: this.vm.converted(b.payout - b.stake, b.currency),
    }));
    const missing = values.some((v) => v.stake === null || v.profit === null),
      stake = values.reduce((s, v) => s + (v.stake ?? 0), 0),
      profit = values.reduce((s, v) => s + (v.profit ?? 0), 0);
    const decisive = bets.filter((b) => b.status === 'won' || b.status === 'lost');
    return {
      count: bets.length,
      profit: missing ? null : profit,
      yield: missing || !stake ? null : (profit / stake) * 100,
      win: decisive.length
        ? (decisive.filter((b) => b.status === 'won').length / decisive.length) * 100
        : null,
    };
  }
  bands = computed(() => [
    {
      label: 'Bajas · menos de 1.50',
      ...this.summarize(this.closed().filter((b) => Number(b.odds) < 1.5)),
    },
    {
      label: 'Medias · 1.50 a 2.20',
      ...this.summarize(
        this.closed().filter((b) => Number(b.odds) >= 1.5 && Number(b.odds) <= 2.2),
      ),
    },
    {
      label: 'Altas · más de 2.20',
      ...this.summarize(this.closed().filter((b) => Number(b.odds) > 2.2)),
    },
  ]);
  heat = computed(() => {
    const groups = new Map<string, Bet[]>();
    for (const b of this.closed())
      for (const c of insightCategories(b)) {
        const label = c.sport + ' · ' + (b.league_tag ?? 'Sin liga') + ' · ' + c.market;
        const list = groups.get(label) ?? [];
        if (!list.some((x) => x.id === b.id)) list.push(b);
        groups.set(label, list);
      }
    return Array.from(groups, ([label, bets]) => ({ label, ...this.summarize(bets) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);
  });
  longParlays = computed(() =>
    this.summarize(
      this.closed().filter((b) => b.bet_type === 'parlay' && (b.legs?.length ?? 0) > 4),
    ),
  );
  singles = computed(() =>
    this.summarize(this.closed().filter((b) => (b.bet_type ?? 'simple') === 'simple')),
  );
  late = computed(() => {
    const losses = this.closed().filter((b) => b.payout < b.stake);
    const late = losses.filter((b) => {
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hourCycle: 'h23',
          timeZone: this.vm.data().profile.timezone ?? 'America/Mexico_City',
        }).format(
          new Date(b.created.includes('T') ? b.created : b.created.replace(' ', 'T') + 'Z'),
        ),
      );
      return hour >= 22 || hour < 2;
    });
    return {
      count: late.length,
      total: losses.length,
      percent: losses.length ? (late.length / losses.length) * 100 : null,
    };
  });
}
