import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChallengesService } from '../services/challenges.service';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { Challenge } from '../services/challenge.model';
@Component({
  selector: 'app-challenges-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './challenges-page.component.html',
  host: { class: 'block space-y-6' },
})
export class ChallengesPageComponent implements OnInit {
  vm = inject(LedgerState);
  service = inject(ChallengesService);
  loading = signal(true);
  failed = signal(false);
  archived = signal(false);
  selected = signal<number | null>(null);
  title = '';
  kind = 'ladder';
  house = '';
  initial: number | null = null;
  target: number | null = null;
  steps = 5;
  betId = '';
  minOdds: number | null = null;
  maxOdds: number | null = null;
  maxStake: number | null = null;
  ruleSport = '';
  ruleType = '';
  maxPerDay: number | null = null;
  projectionOdds = 1.8;
  projectionPoints(c: Challenge) {
    const steps = this.projection(c);
    if (steps === null || steps === 0) return '';
    const count = Math.min(steps, 30),
      top = Math.max(c.reference, c.target);
    return Array.from(
      { length: count + 1 },
      (_, i) =>
        `${20 + (i / count) * 360},${150 - (Math.min(top, c.reference * Math.pow(this.projectionOdds, i)) / top) * 130}`,
    ).join(' ');
  }
  projection(c: Challenge) {
    if (c.reference <= 0 || !Number.isFinite(this.projectionOdds) || this.projectionOdds <= 1)
      return null;
    return Math.max(0, Math.ceil(Math.log(c.target / c.reference) / Math.log(this.projectionOdds)));
  }
  kinds: Record<string, string> = {
    ladder: 'Escalera',
    target: 'Objetivo de saldo',
    tracking: 'Seguimiento de apuestas',
  };
  statuses: Record<string, string> = {
    active: 'Activo',
    paused: 'En pausa',
    completed: 'Finalizado',
    archived: 'Archivado',
  };
  rows = computed(() =>
    this.service.items().filter((c) => (c.status === 'archived') === this.archived()),
  );
  detail = computed(() => this.service.items().find((c) => c.id === this.selected()) ?? null);
  available = computed(() =>
    this.vm
      .data()
      .bets.filter(
        (b) =>
          b.house_id === this.detail()?.house_id &&
          !this.detail()?.bets.some((link) => link.id === b.id),
      ),
  );
  async ngOnInit() {
    await this.reload();
  }
  async reload() {
    this.loading.set(true);
    this.failed.set(!(await this.vm.run(() => this.service.load())));
    this.loading.set(false);
  }
  currency() {
    return this.vm.data().houses.find((h) => String(h.id) === this.house)?.currency ?? 'MXN';
  }
  async create() {
    if (this.initial === null || (this.kind !== 'tracking' && this.target === null)) return;
    if (
      await this.vm.run(() =>
        this.service.create({
          title: this.title,
          kind: this.kind,
          house_id: Number(this.house),
          initial: this.initial,
          target: this.kind === 'tracking' ? this.initial : this.target,
          steps: this.steps,
          rules: {
            min_odds: this.minOdds,
            max_odds: this.maxOdds,
            max_stake: this.maxStake,
            sport: this.ruleSport,
            bet_type: this.ruleType,
            max_per_day: this.maxPerDay,
          },
        }),
      )
    ) {
      this.title = '';
      this.selected.set(this.service.items()[0]?.id ?? null);
      this.vm.notice.set('Reto creado. No se movió dinero del bank.');
    }
  }
  async link() {
    const id = this.selected();
    if (id && this.betId && (await this.vm.run(() => this.service.link(id, Number(this.betId)))))
      this.betId = '';
  }
  status(c: Challenge, status: string) {
    void this.vm.run(() => this.service.status(c.id, status));
  }
  unlink(c: Challenge, id: number) {
    void this.vm.run(() => this.service.link(c.id, id, false));
  }
}
