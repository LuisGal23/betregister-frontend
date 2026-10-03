import { Component, computed, inject, input, signal } from '@angular/core';

import { LedgerState } from '../../../../core/services/ledger-state.service';

import type { EventPoint } from '../../../../shared/utils/event-series.utils';
@Component({
  selector: 'app-profit-chart',
  imports: [],
  templateUrl: './profit-chart.component.html',
  styleUrl: './profit-chart.component.css',
})
export class ProfitChartComponent {
  private static counter = 0;
  gradientId = `profit-colors-${++ProfitChartComponent.counter}`;
  series = input.required<EventPoint[]>();
  period = input<string>('month');
  vm = inject(LedgerState);
  active = signal<string | null>(null);
  graph = computed(() => {
    const values = this.series().map((p) => p.value);
    const min = Math.min(0, ...values),
      max = Math.max(0, ...values);
    const start = this.series()[0]?.time ?? 0,
      end = this.series().at(-1)?.time ?? start;
    const coords = this.series().map((p) => ({
      ...p,
      x: 24 + ((p.time - start) / (end - start || 1)) * 552,
      y: 180 - ((p.value - min) / (max - min || 1)) * 144,
    }));
    const path = coords.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
    return {
      min,
      max,
      zero: 180 - (-min / (max - min || 1)) * 144,
      path,
      area: `${path} L576,180 L24,180 Z`,
      coords,
      start,
      end,
    };
  });
  points = computed(() => this.graph().coords.filter((p) => p.event));
  selected = computed(() => this.points().find((p) => p.id === this.active()));
  label(time: number, full = false) {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: this.vm.data().profile.timezone ?? 'America/Mexico_City',
      ...(full
        ? ({
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          } as const)
        : this.period() === 'day'
          ? ({ hour: '2-digit', minute: '2-digit' } as const)
          : ({ day: '2-digit', month: 'short' } as const)),
      hourCycle: 'h23',
    }).format(new Date(time));
  }
  ticks = computed(() => {
    const { start, end } = this.graph();
    const step =
      this.period() === 'day'
        ? Math.max(1, Math.ceil((end - start) / 3600000 / 6)) * 3600000
        : Math.max(1, Math.ceil((end - start) / 86400000 / 6)) * 86400000;
    const ticks: { x: number; text: string }[] = [];
    for (let t = start; t <= end; t += step)
      ticks.push({ x: 24 + ((t - start) / (end - start || 1)) * 552, text: this.label(t) });
    return ticks;
  });
  color(value: number) {
    return value > 0 ? 'var(--positive)' : value < 0 ? 'var(--negative)' : 'var(--muted)';
  }
  description(value: number) {
    return value > 0
      ? 'Ganancia positiva'
      : value < 0
        ? 'Ganancia negativa'
        : 'Sin ganancia ni pérdida';
  }
}
