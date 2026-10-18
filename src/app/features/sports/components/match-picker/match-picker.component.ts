import { Component, computed, inject, input, output, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SportsService } from '../../services/sports.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { zoneDay } from '../../../../shared/utils/zone.utils';
import type { GameReference, League, Scoreboard, SportsGame } from '../../models/sports.model';
import { ScoreCardComponent } from '../score-card/score-card.component';
@Component({
  selector: 'app-match-picker',
  imports: [FormsModule, ScoreCardComponent],
  templateUrl: './match-picker.component.html',
  host: { class: 'block' },
})
export class MatchPickerComponent implements OnDestroy {
  complete = output();
  selected = input<GameReference[]>([]);
  limit = input(1);
  selection = output<GameReference[]>();
  sportChange = output<string>();
  vm = inject(LedgerState);
  service = inject(SportsService);
  leagues = signal<League[]>([]);
  sport = signal('Fútbol');
  league = 'mls';
  day = zoneDay(new Date().toISOString(), this.vm.data().profile.timezone);
  board = signal<Scoreboard | null>(null);
  loading = signal(false);
  error = signal('');
  query = signal('');
  onlyLive = signal(false);
  automatic = false;
  open = false;
  private timer?: ReturnType<typeof setTimeout>;
  private version = 0;
  private destroyed = false;
  private lastKey = '';
  private nextRefresh = 0;
  options = computed(() => this.leagues().filter((l) => l.sport === this.sport()));
  matches = computed(() =>
    (this.board()?.events ?? []).filter(
      (g) =>
        (!this.onlyLive() || g.state === 'live') &&
        `${g.home} ${g.away}`.toLowerCase().includes(this.query().toLowerCase()),
    ),
  );
  async toggle(event: Event) {
    if (event.target !== event.currentTarget) return;
    this.open = (event.target as HTMLDetailsElement).open;
    if (!this.open) {
      clearTimeout(this.timer);
      return;
    }
    if (!this.leagues().length) {
      try {
        this.leagues.set((await this.service.leagues()).leagues);
      } catch {
        this.error.set('No se pudo cargar el catálogo. Puedes escribir el partido manualmente.');
        return;
      }
    }
    if (this.open) await this.load();
  }
  changeSport(value: string) {
    this.sport.set(value);
    this.sportChange.emit(value);
    this.league = this.options()[0]?.id ?? 'mls';
    void this.load();
  }
  async load() {
    if (!this.day || !this.league || this.destroyed) return;
    const key = `${this.league}:${this.day}`;
    if (key === this.lastKey && this.loading()) return;
    if (key === this.lastKey && this.board() && Date.now() < this.nextRefresh) { this.schedule(); return; }
    this.lastKey = key;
    clearTimeout(this.timer);
    const version = ++this.version;
    this.loading.set(true);
    this.error.set('');
    this.board.set(null);
    try {
      const result = await this.service.events(this.league, this.day);
      if (!this.destroyed && version === this.version) {
        this.nextRefresh = Date.now() + result.refresh_seconds * 1000;
        this.board.set({
          ...result,
          events: result.events.map((game) => ({
            ...game,
            stale: result.stale,
            updated_at: result.updated_at,
          })),
        });
      }
    } catch (error) {
      if (!this.destroyed && version === this.version)
        this.error.set(
          error instanceof Error ? error.message : 'No se pudieron consultar los partidos.',
        );
    } finally {
      if (!this.destroyed && version === this.version) {
        this.loading.set(false);
        this.schedule();
      }
    }
  }
  schedule() {
    clearTimeout(this.timer);
    if (this.destroyed || !this.open || !this.automatic) return;
    this.timer = setTimeout(
      () => {
        if (document.visibilityState === 'visible') void this.load();
        else this.schedule();
      },
      (this.board()?.refresh_seconds ?? 60) * 1000,
    );
  }
  chosen(id: string) {
    return this.selected().some((g) => g.id === id);
  }
  choose(game: SportsGame) {
    if (this.chosen(game.id)) this.remove(game.id);
    else if (this.limit() === 1) this.selection.emit([game]);
    else if (this.selected().length < this.limit()) this.selection.emit([...this.selected(), game]);
  }
  remove(id: string) {
    this.selection.emit(this.selected().filter((g) => g.id !== id));
  }
  updated(value: string) {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: this.vm.data().profile.timezone ?? 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(value));
  }
  ngOnDestroy() {
    this.destroyed = true;
    ++this.version;
    clearTimeout(this.timer);
  }
}
