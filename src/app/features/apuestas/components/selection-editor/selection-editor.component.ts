import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  type SelectionDetail,
  type MarketDef,
  type MarketCategory,
  getMarketDefsForSport,
  findMarketDef,
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

  currentMarketDef = computed(() => {
    return findMarketDef(this.value().sport, this.value().market);
  });

  filteredMarketDefs = computed(() => {
    const list = getMarketDefsForSport(this.value().sport);
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
    if (m.type === 'player_over_under' || m.type === 'player_anytime') {
      if (!d.description && !d.player) {
        d.description = '';
      }
    }
    if (m.defaultPick) {
      d.pick = m.defaultPick === 'Local' ? (this.game()?.home || 'Local') : m.defaultPick;
    } else {
      d.pick = 'Local';
    }
    if (m.defaultLine !== undefined) {
      d.line = m.defaultLine;
    } else {
      d.line = null;
    }
    this.isMarketOpen.set(false);
  }

  setPick(pick: string) {
    this.value().pick = pick;
  }

  isPlayerProp() {
    const type = this.currentMarketDef()?.type;
    return type === 'player_over_under' || type === 'player_anytime';
  }

  totals() {
    const def = this.currentMarketDef();
    if (def?.type === 'total' || def?.type === 'player_over_under') return true;
    return ['Goles', 'Córners', 'Tarjetas', 'Carreras', 'Puntos'].includes(this.value().market);
  }

  handicap() {
    const def = this.currentMarketDef();
    if (def?.type === 'handicap') return true;
    return this.value().market.includes('Hándicap') || this.value().market.includes('Run Line');
  }

  changeSport(sport: string) {
    this.value().sport = sport;
    const defs = getMarketDefsForSport(sport);
    if (defs.length) {
      this.selectMarket(defs[0]);
    }
  }

  changeGame(id: string) {
    this.value().game_id = id;
    const game = this.game();
    if (game && game.sport !== this.value().sport) {
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
