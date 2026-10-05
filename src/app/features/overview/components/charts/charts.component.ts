import { UnitsService } from '../../../../core/services/units.service';
import { ProfitChartComponent } from '../profit-chart/profit-chart.component';
import { DetailCardComponent } from '../detail-card/detail-card.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';
import { Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { OverviewService } from '../../services/overview.service';

@Component({
  selector: 'app-charts',
  imports: [DecimalPipe, FormsModule, RouterLink, ProfitChartComponent, DetailCardComponent],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css',
})
export class ChartsComponent {
  units = inject(UnitsService);
  unitView = signal(false);
  displaySeries = computed(() => {
    const series = this.analytics.series(),
      unit = this.units.value(this.vm.currency());
    return this.unitView() && unit && unit > 0
      ? (series?.map((p) => ({ ...p, value: p.value / unit, change: p.change / unit })) ?? null)
      : series;
  });
  detail = signal<'bank' | 'bets' | null>(null);
  showDistribution = input(true);
  vm = inject(LedgerState);
  analytics = inject(AnalyticsService);
  totalBank = computed(() => {
    const a = this.vm.total('balance'),
      b = this.vm.total('pending');
    return a === null || b === null ? null : a + b;
  });
  circumference = 2 * Math.PI * 64;
  distribution = inject(OverviewService).distribution;
  colors = ['#7454e8', '#ad9af4', '#667ce3', '#c4bbf8'];
}
