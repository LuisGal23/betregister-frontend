import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SportsService } from '../../services/sports.service';
import type { BetScores, MatchDetails, SportsGame } from '../../services/sports.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-bet-scores',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './bet-scores.component.html',
})
export class BetScoresComponent implements AfterViewInit, OnDestroy {
  betId = input.required<number>();
  title = input.required<string>();
  dismiss = output();

  service = inject(SportsService);
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  result = signal<BetScores | null>(null);
  loading = signal(false);
  error = signal('');
  automatic = true;

  selectedGameIndex = signal(0);
  detailsMap = signal<Record<string, MatchDetails | null>>({});
  detailsLoadingMap = signal<Record<string, boolean>>({});

  private timer?: ReturnType<typeof setTimeout>;
  private destroyed = false;
  private nextRefresh = 0;
  private opener = document.activeElement as HTMLElement | null;

  selectedGame = computed<SportsGame | null>(() => {
    const events = this.result()?.events;
    if (!events || events.length === 0) return null;
    const idx = this.selectedGameIndex();
    return events[idx] ?? events[0];
  });

  activeDetails = computed<MatchDetails | null>(() => {
    const g = this.selectedGame();
    if (!g) return null;
    return this.detailsMap()[g.id] ?? null;
  });

  activeDetailsLoading = computed<boolean>(() => {
    const g = this.selectedGame();
    if (!g) return false;
    return !!this.detailsLoadingMap()[g.id];
  });

  effectiveProbabilities = computed(() => {
    const details = this.activeDetails();
    if (details?.probabilities) {
      return {
        homePct: Math.round(details.probabilities.home_pct),
        awayPct: Math.round(details.probabilities.away_pct),
        drawPct: details.probabilities.draw_pct ? Math.round(details.probabilities.draw_pct) : null,
        source: details.probabilities.source || 'ESPN FPI / BPI',
      };
    }
    const ml = details?.odds?.moneyline;
    if (ml?.home_decimal && ml?.away_decimal) {
      const invHome = 1 / ml.home_decimal;
      const invAway = 1 / ml.away_decimal;
      const invDraw = ml.draw_decimal ? 1 / ml.draw_decimal : 0;
      const sum = invHome + invAway + invDraw;
      return {
        homePct: Math.round((invHome / sum) * 100),
        awayPct: Math.round((invAway / sum) * 100),
        drawPct: invDraw > 0 ? Math.round((invDraw / sum) * 100) : null,
        source: details?.odds?.provider ? `Implícita (${details.odds.provider})` : 'Probabilidad estimada',
      };
    }
    return null;
  });

  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
    void this.load();
  }

  async load() {
    if (this.destroyed || this.loading() || (this.result() && Date.now() < this.nextRefresh)) return;
    clearTimeout(this.timer);
    this.loading.set(true);
    this.error.set('');

    try {
      const res = await this.service.scores(this.betId());
      if (!this.destroyed) {
        this.result.set(res);
        this.nextRefresh = Date.now() + res.refresh_seconds * 1000;
        const current = this.selectedGame();
        if (current) {
          void this.loadDetailsForGame(current);
        }
      }
    } catch (error) {
      if (!this.destroyed) {
        this.result.set(null);
        this.error.set(error instanceof Error ? error.message : 'No se pudieron actualizar los marcadores.');
      }
    } finally {
      if (!this.destroyed) {
        this.loading.set(false);
        this.schedule();
      }
    }
  }

  selectGame(index: number) {
    this.selectedGameIndex.set(index);
    const g = this.selectedGame();
    if (g) {
      void this.loadDetailsForGame(g);
    }
  }

  async loadDetailsForGame(game: SportsGame) {
    if (!game?.id || !game?.league) return;
    if (this.detailsMap()[game.id]) return;

    this.detailsLoadingMap.update((m) => ({ ...m, [game.id]: true }));
    try {
      const details = await this.service.details(game.league, game.id);
      if (!this.destroyed) {
        this.detailsMap.update((m) => ({ ...m, [game.id]: details }));
      }
    } catch {
      // Non-blocking error for extra match stats
    } finally {
      if (!this.destroyed) {
        this.detailsLoadingMap.update((m) => ({ ...m, [game.id]: false }));
      }
    }
  }

  schedule() {
    clearTimeout(this.timer);
    if (this.destroyed || !this.automatic) return;
    this.timer = setTimeout(() => {
      if (document.visibilityState === 'visible') void this.load();
      else this.schedule();
    }, (this.result()?.refresh_seconds ?? 60) * 1000);
  }

  // Visual styling & helpers matching "Cuotas y Stats"
  heroAuraStyle(game: SportsGame): { [key: string]: string } {
    const homeCol = this.teamColor(game.home, game.home_color);
    const awayCol = this.teamColor(game.away, game.away_color);
    return {
      '--home-aura': homeCol,
      '--away-aura': awayCol,
    };
  }

  teamColor(name: string, apiColor?: string | null): string {
    if (apiColor && apiColor.startsWith('#') && apiColor.length >= 4) {
      const hex = apiColor.replace('#', '');
      const num = parseInt(hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex, 16);
      if (!isNaN(num)) {
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness > 30 && brightness < 235) {
          return apiColor;
        }
      }
    }
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    const colors = ['#29b8f5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];
    return colors[Math.abs(hash) % colors.length];
  }

  shortCode(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0].slice(0, 2) + parts[1].slice(0, 1)).toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
  }

  onLogoError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) img.style.display = 'none';
  }

  formatMatchDate(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  hasScores(game: SportsGame): boolean {
    return (
      game.home_score !== null &&
      game.away_score !== null &&
      game.home_score !== undefined &&
      game.away_score !== undefined &&
      game.home_score !== '' &&
      game.away_score !== ''
    );
  }

  totalScore(game: SportsGame): number {
    return (Number(game.home_score) || 0) + (Number(game.away_score) || 0);
  }

  scoreUnit(game: SportsGame): string {
    const l = (game.league || '').toLowerCase();
    if (l === 'nfl' || l === 'nba') return 'pts';
    if (l === 'mlb' || l === 'kbo') return 'carreras';
    return 'goles';
  }

  spreadDiff(game: SportsGame): string {
    if (!this.hasScores(game)) return '';
    const h = Number(game.home_score) || 0;
    const a = Number(game.away_score) || 0;
    const diff = h - a;
    if (diff === 0) return 'Empate';
    if (diff > 0) return `+${diff} ${this.shortCode(game.home)}`;
    return `+${Math.abs(diff)} ${this.shortCode(game.away)}`;
  }

  formatLine(line: any): string {
    const n = Number(line);
    if (isNaN(n)) return String(line ?? '');
    return n > 0 ? `+${n}` : `${n}`;
  }

  translateStatName(name: string): string {
    const map: Record<string, string> = {
      possession: 'Posesión',
      'possession %': 'Posesión (%)',
      'total shots': 'Disparos totales',
      'shots on target': 'Disparos al arco',
      'shots on goal': 'Disparos a portería',
      'corner kicks': 'Tiros de esquina',
      fouls: 'Faltas cometidas',
      offsides: 'Fueras de juego',
      'yellow cards': 'Tarjetas amarillas',
      'red cards': 'Tarjetas rojas',
      saves: 'Atajadas del arquero',
      'total yards': 'Yardas totales',
      'passing yards': 'Yardas por pase',
      'rushing yards': 'Yardas terrestres',
      'first downs': 'Primeros y diez (1st Downs)',
      turnovers: 'Entregas de balón',
      penalties: 'Castigos / Penales',
      rebounds: 'Rebotes totales',
      assists: 'Asistencias',
      steals: 'Robos de balón',
      blocks: 'Bloqueos',
      'field goal %': 'Efectividad de campo %',
      'three point %': 'Triples %',
      'free throw %': 'Tiros libres %',
      runs: 'Carreras anotadas',
      hits: 'Hits / Imparables',
      errors: 'Errores',
      strikeouts: 'Ponches recetados',
      walks: 'Bases por bola',
    };
    return map[name.toLowerCase().trim()] || name;
  }

  parseStatPercentages(homeVal: string, awayVal: string): { homePct: number; awayPct: number } | null {
    if (!homeVal || !awayVal) return null;
    const hNum = parseFloat(homeVal.replace('%', '').trim());
    const aNum = parseFloat(awayVal.replace('%', '').trim());
    if (isNaN(hNum) || isNaN(aNum) || (hNum === 0 && aNum === 0)) return null;
    const total = hNum + aNum;
    const homePct = Math.min(100, Math.max(0, Math.round((hNum / total) * 100)));
    return { homePct, awayPct: 100 - homePct };
  }

  isWinning(scoreA: string | null | undefined, scoreB: string | null | undefined): boolean {
    if (!scoreA || !scoreB) return false;
    return (Number(scoreA) || 0) > (Number(scoreB) || 0);
  }

  num(val: any): number {
    return Number(val) || 0;
  }

  ngOnDestroy() {
    this.destroyed = true;
    clearTimeout(this.timer);
    this.dialog().nativeElement.close();
    if (this.opener?.isConnected) this.opener.focus();
  }
}
