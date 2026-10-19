import { Component, computed, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  type SelectionDetail,
  type MarketDef,
  type MarketCategory,
  getMarketDefsForSport,
  findMarketDef,
  normalizeSportName,
  SELECTION_MARKETS,
} from '../../services/selection-detail';
import type { GameReference } from '../../../partidos/services/sports.model';

@Component({
  selector: 'app-selection-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './selection-editor.component.html',
})
export class SelectionEditorComponent {
  readonly String = String;
  value = input.required<SelectionDetail>();
  index = input(0);
  games = input<GameReference[]>([]);
  showSport = input(false);
  showManual = input(true);

  // Reactive signals for the current selection
  selectedMarket = signal('');
  selectedSport = signal('Fútbol');

  // Custom composite dropdown state
  isMarketOpen = signal(false);
  marketSearch = signal('');
  selectedCategory = signal<'todas' | MarketCategory>('todas');

  marketCategories = [
    { id: 'todas', label: 'Todos' },
    { id: 'principales', label: '⭐ Principales' },
    { id: 'props_jugador', label: '🏃 Props Jugador' },
    { id: 'especiales', label: '🎯 Especiales' },
  ] as const;

  constructor() {
    effect(() => {
      const v = this.value();
      if (v) {
        const game = this.game();
        const sport = game?.sport || v.sport || 'Fútbol';
        this.selectedSport.set(normalizeSportName(sport));
        this.selectedMarket.set(v.market || 'Moneyline');
      }
    });
  }

  currentMarketDef = computed(() => {
    return findMarketDef(this.selectedSport(), this.selectedMarket());
  });

  filteredMarketDefs = computed(() => {
    const list = getMarketDefsForSport(this.selectedSport());
    const cat = this.selectedCategory();
    const query = this.marketSearch().trim().toLowerCase();

    return list.filter((m) => {
      const matchCat = cat === 'todas' || m.category === cat;
      const matchQuery =
        !query ||
        m.label.toLowerCase().includes(query) ||
        m.hint.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  });

  toggleMarketDropdown() {
    this.isMarketOpen.update((v) => !v);
    this.marketSearch.set('');
  }

  closeMarketDropdown() {
    this.isMarketOpen.set(false);
  }

  selectMarket(m: MarketDef) {
    const d = this.value();
    d.market = m.id;
    this.selectedMarket.set(m.id);

    // If player prop, ensure description/player exists
    if (m.type === 'player_over_under' || m.type === 'player_anytime' || m.category === 'props_jugador') {
      if (!d.description) {
        d.description = '';
      }
    }

    // Set smart default pick
    if (m.type === 'total' || m.type === 'player_over_under') {
      d.pick = 'Más de';
    } else if (m.type === 'player_anytime') {
      d.pick = m.defaultPick || 'Anotará';
    } else if (m.type === 'both_score') {
      d.pick = 'Sí';
    } else if (m.type === 'double_chance') {
      d.pick = '1X (Local o Empate)';
    } else if (m.type === 'moneyline' || m.type === 'handicap' || m.type === 'draw_no_bet') {
      d.pick = this.game()?.home || 'Local';
    } else if (m.defaultPick) {
      d.pick = m.defaultPick;
    }

    // Set default line if applicable
    if (m.defaultLine !== undefined) {
      d.line = m.defaultLine;
    } else if (this.totals() || this.handicap()) {
      d.line = this.handicap() ? -0.5 : 2.5;
    }

    this.isMarketOpen.set(false);
  }

  setPick(pick: string) {
    this.value().pick = pick;
  }

  isPlayerProp(): boolean {
    const def = this.currentMarketDef();
    if (def) {
      return def.category === 'props_jugador' || def.type === 'player_over_under' || def.type === 'player_anytime';
    }
    const m = (this.selectedMarket() || this.value().market || '').toLowerCase();
    return (
      m.includes('jugador') ||
      m.includes('touchdown') ||
      m.includes('goleador') ||
      m.includes('yardas') ||
      m.includes('pases') ||
      m.includes('ponches') ||
      m.includes('hits') ||
      m.includes('home run') ||
      m.includes('rebotes') ||
      m.includes('asistencias') ||
      m.includes('triples') ||
      m.includes('faltas') ||
      m.includes('bases')
    );
  }

  totals(): boolean {
    const def = this.currentMarketDef();
    if (def) {
      return def.type === 'total' || def.type === 'player_over_under';
    }
    const m = (this.selectedMarket() || this.value().market || '').toLowerCase();
    return (
      m.includes('total') ||
      m.includes('over') ||
      m.includes('under') ||
      m.includes('goles') ||
      m.includes('puntos') ||
      m.includes('carreras') ||
      m.includes('córners') ||
      m.includes('tarjetas') ||
      m.includes('yardas') ||
      m.includes('tiros') ||
      m.includes('rebotes') ||
      m.includes('asistencias') ||
      m.includes('triples') ||
      m.includes('ponches') ||
      m.includes('hits') ||
      m.includes('bases')
    );
  }

  handicap(): boolean {
    const def = this.currentMarketDef();
    if (def) {
      return def.type === 'handicap';
    }
    const m = (this.selectedMarket() || this.value().market || '').toLowerCase();
    return m.includes('hándicap') || m.includes('handicap') || m.includes('spread') || m.includes('run line');
  }

  changeSport(sport: string) {
    const norm = normalizeSportName(sport);
    this.value().sport = norm;
    this.selectedSport.set(norm);
    const defs = getMarketDefsForSport(norm);
    if (defs.length) {
      this.selectMarket(defs[0]);
    }
  }

  changeGame(id: string) {
    this.value().game_id = id;
    const game = this.game();
    if (game && game.sport) {
      this.changeSport(game.sport);
    }
  }

  game(): GameReference | undefined {
    return (
      this.games().find((g) => g.id === this.value().game_id) ??
      (this.games().length === 1 ? this.games()[0] : undefined)
    );
  }

  shortCode(name: string): string {
    if (!name) return 'TM';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
  }
}
