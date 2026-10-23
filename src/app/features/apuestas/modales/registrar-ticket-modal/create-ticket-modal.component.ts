import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketModalService } from '../../services/ticket-modal.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { BetsService } from '../../services/bets.service';
import { UnitsService } from '../../../../core/services/units.service';
import { ChallengesService } from '../../../desafios/services/challenges.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ScreenshotImportComponent, type ScreenshotDraft } from '../../components/screenshot-import/screenshot-import.component';
import { MatchPickerComponent } from '../../../partidos/components/match-picker/match-picker.component';
import {
  newSelection,
  selectionText,
  type SelectionDetail,
} from '../../services/selection-detail';
import type { GameReference } from '../../../partidos/services/sports.model';
import type { BetLeg } from '../../services/bet.model';
import { LEAGUE_TAGS, sportForLeague } from '../../services/bet-tags';
import { americanPayout, decimalOdds, type OddsFormat } from '../../../../shared/utils/odds.utils';

export interface ManualLegDraft {
  event: string;
  selection: string;
  odds: number | null;
}

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    ScreenshotImportComponent,
    MatchPickerComponent,
  ],
  templateUrl: './create-ticket-modal.component.html',
})
export class CreateTicketModalComponent {
  modal = inject(TicketModalService);
  vm = inject(LedgerState);
  private bets = inject(BetsService);
  units = inject(UnitsService);
  challengeService = inject(ChallengesService);

  readonly Math = Math;
  betType: 'simple' | 'parlay' = 'simple';
  selectedHouse = '';
  selectedGames: GameReference[] = [];
  leagueTag = 'Sin clasificar';
  marketTag = 'Sin clasificar';
  oddsFormat: OddsFormat = 'decimal';
  odds: number | null = null;
  stake: number | null = null;
  bonus: number | null = 0;
  totalOddsMode = false;
  showPicker = signal(false);
  importWarnings = '';

  // Manual-First fields
  manualEvent = '';
  manualSelection = '';
  linkedPredictionId: number | null = null;

  manualLegs: ManualLegDraft[] = [
    { event: '', selection: '', odds: null },
    { event: '', selection: '', odds: null },
  ];

  types = [
    { id: 'simple' as const, label: 'Simple', detail: '1 selección' },
    { id: 'parlay' as const, label: 'Parlay', detail: '2+ selecciones combinadas' },
  ];

  constructor() {
    effect(() => {
      if (this.modal.isOpen()) {
        const initial = this.modal.initialGame();
        const option = this.modal.initialOption();

        // 1. Reset defaults
        this.importWarnings = '';
        this.linkedPredictionId = option?.predictionId ?? null;

        // 2. Pre-fill from initial match
        if (initial) {
          this.selectedGames = [initial];
          this.manualEvent = `${initial.away} vs ${initial.home}`;
          this.leagueTag = initial.league || 'Sin clasificar';
        } else if (option?.games && option.games.length > 0) {
          this.selectedGames = [...option.games];
          this.manualEvent = `${option.games[0].away} vs ${option.games[0].home}`;
        }

        // 3. Pre-fill from option / recommendation
        if (option) {
          if (option.betType === 'parlay') {
            this.betType = 'parlay';
          }
          if (option.odds) {
            this.odds = Number(option.odds);
          }
          if (option.stake) {
            this.stake = Number(option.stake);
          }
          if (option.description || option.market) {
            this.manualSelection = option.description || option.market || '';
          } else if (option.pick) {
            this.manualSelection = option.pick;
          }
          if (option.eventLabel) {
            this.manualEvent = option.eventLabel;
          }
          if (option.legs && option.legs.length > 0) {
            this.manualLegs = option.legs.map((l) => ({
              event: '',
              selection: l.selection || '',
              odds: Number(l.odds) || null,
            }));
          }
        }

        // 4. Default active house
        if (!this.selectedHouse && this.vm.data().houses.length > 0) {
          this.selectedHouse = String(this.vm.data().houses[0].id);
        }
      }
    });
  }

  houseSelected = computed(() =>
    this.vm.data().houses.find((h) => String(h.id) === this.selectedHouse),
  );

  togglePicker() {
    this.showPicker.update((v) => !v);
  }

  chooseGames(games: GameReference[]) {
    this.selectedGames = games;
    if (games.length > 0) {
      if (this.betType === 'simple') {
        this.manualEvent = `${games[0].away} vs ${games[0].home}`;
        this.leagueTag = games[0].league || 'Sin clasificar';
      } else {
        // Fill empty legs with picked games
        games.forEach((g, idx) => {
          if (idx < this.manualLegs.length) {
            if (!this.manualLegs[idx].event) {
              this.manualLegs[idx].event = `${g.away} vs ${g.home}`;
            }
          } else {
            this.manualLegs.push({
              event: `${g.away} vs ${g.home}`,
              selection: '',
              odds: null,
            });
          }
        });
      }
    }
  }

  removeGame(gameId: string) {
    this.selectedGames = this.selectedGames.filter((g) => g.id !== gameId);
  }

  close() {
    this.modal.close();
    this.showPicker.set(false);
    this.vm.error.set('');
  }

  setType(type: 'simple' | 'parlay') {
    this.betType = type;
    this.odds = null;
    if (type === 'parlay') {
      this.updateParlayOdds();
    }
  }

  addManualLeg() {
    if (this.manualLegs.length < 15) {
      this.manualLegs.push({ event: '', selection: '', odds: null });
      this.updateParlayOdds();
    }
  }

  removeManualLeg(idx: number) {
    if (this.manualLegs.length > 2) {
      this.manualLegs.splice(idx, 1);
      this.updateParlayOdds();
    }
  }

  updateParlayOdds() {
    if (this.betType === 'parlay' && !this.totalOddsMode) {
      const validOdds = this.manualLegs
        .map((l) => Number(l.odds))
        .filter((o) => !isNaN(o) && o > 1);
      if (validOdds.length === this.manualLegs.length && validOdds.length > 0) {
        const prod = validOdds.reduce((acc, o) => acc * o, 1);
        this.odds = Number(prod.toFixed(2));
      }
    }
  }

  applyScreenshot(r: ScreenshotDraft) {
    this.selectedGames = [];
    this.betType = r.bet_type === 'parlay' || r.selections.length > 1 ? 'parlay' : 'simple';
    this.totalOddsMode = this.betType === 'parlay';
    this.oddsFormat = 'decimal';
    this.odds = r.odds;
    this.stake = r.stake;
    this.bonus = r.bonus ?? 0;

    if (this.betType === 'simple') {
      const s = r.selections[0];
      this.manualEvent = s?.event || '';
      this.manualSelection = s?.market || s?.detail?.pick || '';
    } else {
      this.manualLegs = r.selections.map((s) => ({
        event: s.event || '',
        selection: s.market || '',
        odds: s.odds || null,
      }));
    }

    const house = this.vm.data().houses.find(
      (h) => h.name.toLowerCase() === r.house?.toLowerCase() && h.currency === r.currency,
    );
    if (house) {
      this.selectedHouse = String(house.id);
    }
    this.importWarnings = 'Datos leídos por escaneo inteligente. Revisa o edita los campos antes de guardar.';
  }

  payout() {
    if (!this.odds || !this.stake) return 0;
    return this.oddsFormat === 'decimal'
      ? this.stake * this.odds
      : americanPayout(this.stake, this.odds);
  }

  async saveTicket() {
    this.vm.error.set('');

    // Validations
    if (!this.selectedHouse) {
      this.vm.error.set('Selecciona la casa de apuestas donde colocaste tu ticket.');
      return;
    }
    if (this.stake === null || this.stake <= 0) {
      this.vm.error.set('Indica el importe de tu apuesta (mayor a $0).');
      return;
    }
    if (this.odds === null || this.odds <= 0) {
      this.vm.error.set('Indica la cuota de tu apuesta.');
      return;
    }
    if (decimalOdds(this.odds, this.oddsFormat) === null) {
      this.vm.error.set('Cuota inválida. En formato decimal debe ser mayor a 1.0 (ej. 1.85).');
      return;
    }

    let finalEvent = '';
    let selectionsPayload: SelectionDetail[] = [];
    let legsPayload: BetLeg[] = [];

    if (this.betType === 'simple') {
      const evName = this.manualEvent.trim() || 'Partido';
      const pickName = this.manualSelection.trim() || 'Selección';

      finalEvent = `${evName} · ${pickName}`.slice(0, 300);

      selectionsPayload = [
        {
          sport: 'Fútbol',
          market: 'Otro',
          pick: pickName,
          line: null,
          description: pickName,
          game_id: this.selectedGames[0]?.id || '',
          event_label: evName,
          prediction_id: this.linkedPredictionId ?? undefined,
        },
      ];
    } else {
      // Parlay
      for (let i = 0; i < this.manualLegs.length; i++) {
        const l = this.manualLegs[i];
        if (!l.selection.trim() && !l.event.trim()) {
          this.vm.error.set(`Escribe el partido y la selección para la selección #${i + 1} del parlay.`);
          return;
        }
      }

      this.updateParlayOdds();

      finalEvent = this.manualLegs
        .map((l) => `${l.event.trim() || 'Partido'} · ${l.selection.trim() || 'Selección'}`)
        .join(' | ')
        .slice(0, 300);

      legsPayload = this.manualLegs.map((l) => ({
        selection: `${l.event.trim() ? l.event.trim() + ' - ' : ''}${l.selection.trim() || 'Selección'}`.slice(0, 200),
        odds: Number(l.odds) || 1.9,
        status: 'pending',
      }));

      selectionsPayload = this.manualLegs.map((l, i) => ({
        sport: 'Fútbol',
        market: 'Otro',
        pick: l.selection.trim() || 'Selección',
        line: null,
        description: l.selection.trim() || 'Selección',
        game_id: this.selectedGames[i]?.id || '',
        event_label: l.event.trim() || 'Partido',
      }));
    }

    try {
      const ok = await this.bets.create({
        public_record: false,
        prediction_id: this.linkedPredictionId,
        selection_details: selectionsPayload,
        odds_format: this.oddsFormat,
        league_tag: this.betType === 'parlay' ? 'Mixto' : 'Sin clasificar',
        market_tag: 'Sin clasificar',
        same_game_selections: [],
        games: this.selectedGames.map((g) => g.id),
        linked_games: this.selectedGames,
        legs: this.betType === 'parlay' && !this.totalOddsMode ? legsPayload : [],
        house_id: Number(this.selectedHouse),
        event: finalEvent,
        odds: this.odds,
        stake: this.stake,
        bet_type: this.betType,
        bonus: this.betType !== 'simple' ? (this.bonus ?? 0) : 0,
      });

      if (ok) {
        this.close();
        this.vm.notice.set('¡Ticket registrado exitosamente en tu bankroll!');
        setTimeout(() => this.vm.notice.set(''), 4000);
      } else if (!this.vm.error()) {
        this.vm.error.set('No se pudo guardar el ticket. Revisa el saldo disponible en la casa seleccionada.');
      }
    } catch (e: any) {
      this.vm.error.set(e?.message || 'Error al guardar el ticket. Revisa los datos ingresados.');
    }
  }
}
