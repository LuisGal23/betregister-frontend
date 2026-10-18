import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketModalService } from '../../services/ticket-modal.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { BetsService } from '../../services/bets.service';
import { UnitsService } from '../../../../core/services/units.service';
import { ChallengesService } from '../../../challenges/services/challenges.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SelectionEditorComponent } from '../selection-editor/selection-editor.component';
import { TicketProtectionComponent } from '../ticket-protection/ticket-protection.component';
import { BankAssistantComponent } from '../bank-assistant/bank-assistant.component';
import { ScreenshotImportComponent, type ScreenshotDraft } from '../screenshot-import/screenshot-import.component';
import { MatchPickerComponent } from '../../../sports/components/match-picker/match-picker.component';
import {
  newSelection,
  selectionText,
  SELECTION_MARKETS,
  type SelectionDetail,
} from '../../models/selection-detail';
import type { GameReference } from '../../../sports/models/sports.model';
import type { BetLeg } from '../../models/bet.model';
import { LEAGUE_TAGS, marketsForLeague, marketLabel, sportForLeague } from '../../models/bet-tags';
import { americanPayout, decimalOdds, type OddsFormat } from '../../../../shared/utils/odds.utils';

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    SelectionEditorComponent,
    TicketProtectionComponent,
    BankAssistantComponent,
    ScreenshotImportComponent,
    MatchPickerComponent,
  ],
  templateUrl: './create-ticket-modal.component.html',
  styleUrl: './create-ticket-modal.component.css',
})
export class CreateTicketModalComponent {
  modal = inject(TicketModalService);
  vm = inject(LedgerState);
  private bets = inject(BetsService);
  units = inject(UnitsService);
  challengeService = inject(ChallengesService);

  readonly Math = Math;
  betType: 'simple' | 'parlay' | 'same_game' = 'simple';
  selectedHouse = '';
  selectedGames: GameReference[] = [];
  leagueTag = 'MLS';
  marketTag = 'Sin clasificar';
  oddsFormat: OddsFormat = 'decimal';
  odds: number | null = null;
  stake: number | null = null;
  bonus: number | null = 0;
  totalOddsMode = false;
  quickMode = signal(false);
  importWarnings = '';
  event = '';
  sameGameSelections = ['', ''];
  legs: BetLeg[] = [
    { selection: '', odds: 2, status: 'pending' },
    { selection: '', odds: 2, status: 'pending' },
  ];
  selections: SelectionDetail[] = [newSelection()];

  types = [
    { id: 'simple', label: 'Simple', detail: '1 partido' },
    { id: 'parlay', label: 'Parlay', detail: 'Varios partidos' },
    { id: 'same_game', label: 'Mismo partido', detail: '2+ selecciones' },
  ] as const;

  constructor() {
    effect(() => {
      if (this.modal.isOpen()) {
        const initial = this.modal.initialGame();
        const option = this.modal.initialOption();
        if (initial) {
          this.chooseGames([initial]);
        }
        if (option) {
          if (option.odds) {
            this.odds = Number(option.odds);
          }
          if (option.eventLabel) {
            this.event = option.eventLabel;
          }
          if (this.selections.length > 0) {
            if (option.market) this.selections[0].market = option.market;
            if (option.pick) this.selections[0].pick = option.pick;
            if (option.line !== undefined && option.line !== null) this.selections[0].line = option.line;
            if (option.description) this.selections[0].description = option.description;
          }
        }
        if (!this.selectedHouse && this.vm.data().houses.length > 0) {
          this.selectedHouse = String(this.vm.data().houses[0].id);
        }
      }
    });
  }

  houseSelected = computed(() =>
    this.vm.data().houses.find((h) => String(h.id) === this.selectedHouse),
  );

  close() {
    this.modal.close();
    this.vm.error.set('');
  }

  setType(type: 'simple' | 'parlay' | 'same_game') {
    this.betType = type;
    this.totalOddsMode = false;
    this.odds = null;
    if (type === 'simple') this.selections = this.selections.slice(0, 1);
    else if (this.selections.length < 2)
      this.selections.push(newSelection(sportForLeague(this.leagueTag)));
    this.legs = this.selections.map(
      (_, i) => this.legs[i] ?? { selection: '', odds: 2, status: 'pending' },
    );
    this.updateOdds();
    this.syncSelections();
  }

  chooseGames(games: GameReference[]) {
    this.selectedGames = games;
    this.syncSelections();
    if (games.length) {
      const league = games[0].league;
      this.setLeague(
        games.some((g) => g.league !== league)
          ? 'Mixto'
          : ({
              nations: 'Selecciones',
              'concacaf-nations': 'Selecciones',
              friendlies: 'Selecciones',
              worldcup: 'Selecciones',
              euro: 'Selecciones',
              'copa-america': 'Selecciones',
              'gold-cup': 'Selecciones',
              'qualifiers-uefa': 'Selecciones',
              'qualifiers-conmebol': 'Selecciones',
              'qualifiers-concacaf': 'Selecciones',
              mlb: 'MLB',
              nfl: 'NFL',
              nba: 'NBA',
              mls: 'MLS',
              kbo: 'KBO',
              ligamx: 'Liga MX',
            }[league] ?? 'Fútbol Europeo'),
      );
    }
  }

  setLeague(league: string) {
    this.leagueTag = league;
    const sport = sportForLeague(league);
    if (SELECTION_MARKETS[sport])
      this.selections = this.selections.map((d) =>
        d.sport === sport
          ? d
          : { ...newSelection(sport), game_id: d.game_id, event_label: d.event_label },
      );
    if (!marketsForLeague(league).includes(this.marketTag)) this.marketTag = 'Sin clasificar';
  }

  setSport(sport: string) {
    if (sportForLeague(this.leagueTag) !== sport)
      this.setLeague(
        (
          { Fútbol: 'MLS', Béisbol: 'MLB', Americano: 'NFL', Mixto: 'Mixto' } as Record<string, string>
        )[sport] ?? 'Sin clasificar',
      );
  }

  leagueOptions() {
    const sport = sportForLeague(this.leagueTag);
    return ['Fútbol', 'Béisbol', 'Americano'].includes(sport)
      ? LEAGUE_TAGS.filter((league) => sportForLeague(league) === sport)
      : LEAGUE_TAGS;
  }

  sportForLeague = sportForLeague;

  addSelection() {
    this.selections.push(newSelection(sportForLeague(this.leagueTag)));
    this.legs.push({ selection: '', odds: 2, status: 'pending' });
    this.syncSelections();
  }

  removeSelection(i: number) {
    this.selections.splice(i, 1);
    this.legs.splice(i, 1);
    this.updateOdds();
  }

  syncSelections() {
    this.selections.forEach((d, i) => {
      if (this.selectedGames.length && !this.selectedGames.some((g) => g.id === d.game_id))
        d.game_id = this.selectedGames[Math.min(i, this.selectedGames.length - 1)].id;
      if (!this.selectedGames.length) d.game_id = '';
      const g = this.selectedGames.find((g) => g.id === d.game_id);
      if (g && d.sport !== g.sport) Object.assign(d, newSelection(g.sport), { game_id: g.id });
    });
  }

  updateOdds() {
    if (this.betType === 'parlay' && !this.totalOddsMode) {
      const dec = this.legs.reduce((acc, leg) => acc * (Number(leg.odds) || 1), 1);
      this.odds = Number(dec.toFixed(4));
    }
  }

  applyScreenshot(r: ScreenshotDraft) {
    this.quickMode.set(true);
    this.selectedGames = [];
    this.betType = r.bet_type ?? (r.selections.length > 1 ? 'parlay' : 'simple');
    this.totalOddsMode = this.betType === 'parlay';
    this.oddsFormat = 'decimal';
    this.odds = r.odds;
    this.stake = r.stake;
    this.bonus = r.bonus ?? 0;
    this.selections = r.selections.map((s) =>
      s.detail
        ? { ...s.detail, line: s.detail.line === null ? null : Number(s.detail.line) }
        : {
            ...newSelection(s.sport ?? 'Fútbol'),
            market: 'Otro',
            description: (s.market ?? '').slice(0, 200),
            event_label: (s.event ?? '').slice(0, 120),
          },
    );
    this.legs = r.selections.map((s) => ({ selection: s.market ?? '', odds: s.odds ?? 0, status: 'pending' }));
    const sports = [...new Set(this.selections.map((s) => s.sport))];
    this.leagueTag =
      sports.length > 1 ? 'Mixto' : sports[0] === 'Béisbol' ? 'MLB' : sports[0] === 'Americano' ? 'NFL' : 'Fútbol Europeo';
    const house = this.vm.data().houses.find(
      (h) => h.name.toLowerCase() === r.house?.toLowerCase() && h.currency === r.currency,
    );
    this.selectedHouse = house ? String(house.id) : '';
    this.importWarnings = 'Borrador leído por IA. Revisa los datos antes de guardar.';
  }

  payout() {
    if (!this.odds || !this.stake) return 0;
    return this.oddsFormat === 'decimal'
      ? this.stake * this.odds
      : americanPayout(this.stake, this.odds);
  }

  async saveTicket() {
    if (this.betType === 'same_game')
      for (const d of this.selections) d.event_label = this.selections[0].event_label;
    const labels = this.selections.map((d) => selectionText(d));
    this.event = this.selections
      .map((d) => {
        const g = this.selectedGames.find((g) => g.id === d.game_id);
        return (g ? g.away + ' vs ' + g.home : d.event_label) + ' · ' + selectionText(d);
      })
      .join(' | ')
      .slice(0, 300);
    this.sameGameSelections = labels.map((label) => label.slice(0, 200));
    this.legs = this.selections.map((_, i) => ({
      ...this.legs[i],
      selection: labels[i].slice(0, 200),
    }));
    const categories = [...new Set(this.selections.map((d) => d.market))];
    this.marketTag =
      categories.length === 1 && this.leagueTag !== 'Mixto' ? categories[0] : 'Mixto';
    this.updateOdds();

    if (!this.selectedHouse) {
      this.vm.error.set('Selecciona una casa de apuestas para registrar el ticket.');
      return;
    }
    if (this.stake === null || this.stake <= 0) {
      this.vm.error.set('Indica el importe de la apuesta.');
      return;
    }
    if (this.odds === null) {
      this.vm.error.set('Indica la cuota de la apuesta.');
      return;
    }
    if (decimalOdds(this.odds, this.oddsFormat) === null) {
      this.vm.error.set(
        'Cuota inválida. Decimal: mayor que 1. Americana: entero de -100 o menor, o +100 o mayor.',
      );
      return;
    }

    const ok = await this.bets.create({
      public_record: false,
      selection_details: this.selections,
      odds_format: this.oddsFormat,
      league_tag: this.leagueTag,
      market_tag: this.marketTag,
      same_game_selections: this.betType === 'same_game' ? this.sameGameSelections : [],
      games: this.selectedGames.map((g) => g.id),
      legs: this.betType === 'parlay' && !this.totalOddsMode ? this.legs : [],
      house_id: Number(this.selectedHouse),
      event: this.event,
      odds: this.odds,
      stake: this.stake,
      bet_type: this.betType,
      bonus: this.betType !== 'simple' ? (this.bonus ?? 0) : 0,
    });

    if (ok) {
      this.close();
      this.vm.notice.set('¡Ticket registrado exitosamente!');
      setTimeout(() => this.vm.notice.set(''), 4000);
    }
  }
}
