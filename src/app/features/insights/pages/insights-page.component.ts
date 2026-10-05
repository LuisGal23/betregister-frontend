import { AdvancedAnalysisComponent } from '../components/advanced-analysis/advanced-analysis.component';
import { insightCategories, matchesInsightTags } from '../models/market-insights';
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InsightsService } from '../services/insights.service';
import { MARKET_TAGS, marketLabel } from '../../bets/models/bet-tags';
import { timestamp } from '../../../shared/utils/date.utils';
@Component({
  selector: 'app-insights-page',
  imports: [AdvancedAnalysisComponent, FormsModule, RouterLink, DatePipe],
  templateUrl: './insights-page.component.html',
  styleUrl: './insights-page.component.css',
})
export class InsightsPageComponent {
  tab = signal('efficiency');
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
  barMax = computed(() => Math.max(1, ...this.insights.rows().map((g) => Math.abs(g.profit ?? 0))));
  Math = Math;
  pending = computed(() => this.insights.bets().filter((b) => b.status === 'pending').length);
  sportLabel(value: string) {
    return value === 'Americano' ? 'NFL' : value || 'Todos';
  }
  marketTags = MARKET_TAGS;
  marketLabel = marketLabel;
  timestamp = timestamp;
  selected = signal<string | null>(null);
  detail = computed(() => this.insights.groups().find((g) => g.key === this.selected()) ?? null);
  detailTickets = computed(() =>
    [...(this.detail()?.tickets ?? [])]
      .sort((a, b) => b.created.localeCompare(a.created))
      .slice(0, 10),
  );
  typeLabel(type: string) {
    return type === 'all'
      ? 'Todos los tipos de ticket'
      : type === 'same_game'
        ? 'Mismo partido'
        : type === 'parlay'
          ? 'Parlay'
          : 'Simple';
  }
  percent(value: number | null) {
    return value === null ? '—' : value.toFixed(1) + '%';
  }
  async refresh() {
    await this.vm.run(() => this.vm.refresh());
  }
}
