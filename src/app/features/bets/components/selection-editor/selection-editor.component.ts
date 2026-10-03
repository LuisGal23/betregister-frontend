import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SELECTION_MARKETS, type SelectionDetail } from '../../models/selection-detail';
import type { GameReference } from '../../../sports/models/sports.model';
@Component({
  selector: 'app-selection-editor',
  imports: [FormsModule],
  templateUrl: './selection-editor.component.html',
  styleUrl: './selection-editor.component.css',
})
export class SelectionEditorComponent {
  value = input.required<SelectionDetail>();
  index = input(0);
  games = input<GameReference[]>([]);
  showSport = input(false);
  showManual = input(true);
  markets = SELECTION_MARKETS;
  totals() {
    return ['Goles', 'Córners', 'Tarjetas', 'Carreras', 'Puntos'].includes(this.value().market);
  }
  handicap() {
    return this.value().market.includes('Hándicap');
  }
  changeMarket(market: string) {
    const d = this.value();
    d.market = market;
    d.description = '';
    d.line = null;
    d.pick = this.totals()
      ? 'Más de'
      : market === 'Ambos anotan'
        ? 'Sí'
        : market === 'Otro'
          ? ''
          : 'Local';
  }
  changeSport(sport: string) {
    this.value().sport = sport;
    this.changeMarket(this.markets[sport][0]);
  }
  changeGame(id: string) {
    this.value().game_id = id;
    const game = this.game();
    if (game && game.sport !== this.value().sport) this.changeSport(game.sport);
  }
  game() {
    return (
      this.games().find((g) => g.id === this.value().game_id) ??
      (this.games().length === 1 ? this.games()[0] : undefined)
    );
  }
}
