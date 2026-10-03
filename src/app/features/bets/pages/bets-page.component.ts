import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectionEditorComponent } from '../components/selection-editor/selection-editor.component';
import {
  newSelection,
  selectionText,
  SELECTION_MARKETS,
  type SelectionDetail,
} from '../models/selection-detail';
import { BankAssistantComponent } from '../components/bank-assistant/bank-assistant.component';
import { MatchPickerComponent } from '../../sports/components/match-picker/match-picker.component';
import { BetScoresComponent } from '../../sports/components/bet-scores/bet-scores.component';
import type { GameReference } from '../../sports/models/sports.model';
import { CsvTransferComponent } from '../components/csv-transfer/csv-transfer.component';
import { BetManagementComponent } from '../components/bet-management/bet-management.component';
import { Component, ElementRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

import { computed, signal } from '@angular/core';
import { BetsService } from '../services/bets.service';
import type { Bet, BetResult, BetStatus, BetLeg } from '../models/bet.model';
import type { Review } from '../../../shared/models/review.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { winningPayout } from '../../../shared/utils/ledger.utils';
import { timestamp } from '../../../shared/utils/date.utils';
import { americanPayout, decimalOdds, type OddsFormat } from '../../../shared/utils/odds.utils';
import { LEAGUE_TAGS, marketsForLeague, marketLabel, sportForLeague } from '../models/bet-tags';

@Component({
  selector: 'app-bets-page',
  imports: [
    RouterLink,
    SelectionEditorComponent,
    FormsModule,
    DatePipe,

    IconComponent,
    ConfirmDialogComponent,
    BetManagementComponent,
    CsvTransferComponent,
    BankAssistantComponent,
    MatchPickerComponent,
    BetScoresComponent,
  ],
  templateUrl: './bets-page.component.html',
  styleUrl: './bets-page.component.css',
})
export class BetsPageComponent {
  constructor() {
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((p) => {
        this.workspaceMode.set(
          p.has('status') || p.get('view') === 'history' ? 'history' : 'register',
        );
        this.betFilter.set(p.get('status') === 'pending' ? 'pending' : 'all');
      });
  }
  private element = inject<ElementRef<HTMLElement>>(ElementRef);
  focusTicket() {
    this.element.nativeElement.querySelector<HTMLSelectElement>('[name=betHouse]')?.focus();
  }
  vm = inject(LedgerState);
  readonly Math = Math;

  private bets = inject(BetsService);
  selectedHouse = this.vm.data().houses.length === 1 ? String(this.vm.data().houses[0].id) : '';
  historyTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'simple', label: 'Simples' },
    { value: 'parlay', label: 'Parlays' },
    { value: 'same_game', label: 'Mismo partido' },
  ] as const;
  activity = computed(() => {
    const bets = this.vm.data().bets.filter((b) => !b.history_hidden);
    return {
      pending: bets.filter((b) => b.status === 'pending').length,
      won: bets.filter((b) => b.status === 'won').length,
      lost: bets.filter((b) => b.status === 'lost').length,
    };
  });
  showResult(status: BetStatus) {
    this.workspaceMode.set('history');
    this.betFilter.set(status);
    this.typeFilter.set('all');
    this.showHidden.set(false);
    this.search.set('');
  }
  leagueTag = 'MLS';
  selections: SelectionDetail[] = [newSelection()];
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
  marketTag = 'Sin clasificar';
  leagueTags = LEAGUE_TAGS;
  marketLabel = marketLabel;
  sportForLeague = sportForLeague;
  marketOptions() {
    return marketsForLeague(this.leagueTag, this.marketTag);
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
  calendarSport(sport: string) {
    if (!this.selectedGames.length) this.setSport(sport);
  }
  setSport(sport: string) {
    if (sportForLeague(this.leagueTag) !== sport)
      this.setLeague(
        (
          { Fútbol: 'MLS', Béisbol: 'MLB', Americano: 'NFL', Mixto: 'Mixto' } as Record<
            string,
            string
          >
        )[sport] ?? 'Sin clasificar',
      );
  }
  leagueOptions() {
    const sport = sportForLeague(this.leagueTag);
    return ['Fútbol', 'Béisbol', 'Americano'].includes(sport)
      ? this.leagueTags.filter((league) => sportForLeague(league) === sport)
      : this.leagueTags;
  }
  workspaceMode = signal<'register' | 'history'>(
    inject(ActivatedRoute).snapshot.queryParamMap.has('status') ||
      inject(ActivatedRoute).snapshot.queryParamMap.get('view') === 'history'
      ? 'history'
      : 'register',
  );
  oddsFormat: OddsFormat = 'decimal';
  selectedGames: GameReference[] = [];
  scoreBet = signal<Bet | null>(null);
  management = signal<{ bet: Bet; mode: 'correct' | 'partial' | 'legs' | 'tags' } | null>(null);
  legs: BetLeg[] = [
    { selection: '', odds: 2, status: 'pending' },
    { selection: '', odds: 2, status: 'pending' },
  ];
  sameGameSelections = ['', ''];
  types = [
    { id: 'simple', label: 'Simple', detail: 'Una selección' },
    { id: 'parlay', label: 'Parlay', detail: 'Varios partidos' },
    { id: 'same_game', label: 'Mismo partido', detail: 'Dos o más selecciones' },
  ] as const;
  setType(type: 'simple' | 'parlay' | 'same_game') {
    this.betType = type;
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
              mls: 'MLS',
              kbo: 'KBO',
              ligamx: 'Liga MX',
            }[league] ?? 'Fútbol Europeo'),
      );
    }
  }
  event = '';
  betType: 'simple' | 'parlay' | 'same_game' = 'simple';
  bonus: number | null = 0;
  odds: number | null = null;
  stake: number | null = null;
  cashoutId: number | null = null;
  cashoutAmount: number | null = null;
  betFilter = signal<BetStatus | 'all'>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('status') === 'pending' ? 'pending' : 'all',
  );
  search = signal('');
  showHidden = signal(false);
  typeFilter = signal<'all' | 'simple' | 'parlay' | 'same_game'>('all');
  review = signal<Review | null>(null);
  timestamp = timestamp;
  tabs: { value: BetStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'won', label: 'Ganadas' },
    { value: 'lost', label: 'Perdidas' },
    { value: 'void', label: 'Anuladas' },
    { value: 'cashout', label: 'Cashout' },
  ];
  filteredBets = computed(() =>
    this.vm
      .data()
      .bets.filter(
        (b) =>
          Boolean(b.history_hidden) === this.showHidden() &&
          (this.betFilter() === 'all' || b.status === this.betFilter()) &&
          (this.typeFilter() === 'all' || (b.bet_type ?? 'simple') === this.typeFilter()) &&
          `${b.event} ${b.house} ${(b.linked_games ?? []).map((g) => `${g.home} ${g.away} ${g.league_name}`).join(' ')}`
            .toLowerCase()
            .includes(this.search().toLowerCase()),
      ),
  );
  selectedBank() {
    return this.vm.data().houses.find((h) => String(h.id) === this.selectedHouse);
  }
  inputCurrency() {
    return (
      this.vm.data().houses.find((h) => String(h.id) === this.selectedHouse)?.currency ?? 'MXN'
    );
  }
  reviewHistory(b: Bet) {
    this.vm.error.set('');
    const hidden = !b.history_hidden;
    this.review.set({
      title: hidden ? '¿Eliminar esta apuesta del historial?' : '¿Restaurar esta apuesta?',
      message: `${b.event} · ${b.house}`,
      amount: this.vm.native(b.stake, b.currency),
      note: hidden
        ? 'Se ocultará de los listados. El saldo, los movimientos, las métricas y la gráfica se conservarán. Puedes recuperarla desde «Ver eliminadas».'
        : 'Volverá a aparecer en el historial. No se modifica ningún movimiento ni resultado.',
      confirmLabel: hidden ? 'Eliminar del historial' : 'Restaurar apuesta',
      execute: () => this.bets.setHistory(b.id, hidden),
    });
  }
  expectedReturn() {
    if (!this.stake || decimalOdds(this.odds, this.oddsFormat) === null) return null;
    return (
      (this.oddsFormat === 'american'
        ? americanPayout(Math.round(this.stake * 100), this.odds!)
        : winningPayout(Math.round(this.stake * 100), String(this.odds))) +
      (this.betType !== 'simple' ? Math.round((this.bonus ?? 0) * 100) : 0)
    );
  }
  updateOdds() {
    if (this.betType !== 'parlay') this.selectedGames = this.selectedGames.slice(0, 1);
    if (this.betType === 'parlay') {
      this.oddsFormat = 'decimal';
      this.odds = Math.round(this.legs.reduce((n, leg) => n * Number(leg.odds), 1) * 10000) / 10000;
    }
  }
  decimalPreview() {
    return decimalOdds(this.odds, this.oddsFormat);
  }
  async addBet() {
    this.syncSelections();
    for (const d of this.selections) {
      const g = this.selectedGames.find((g) => g.id === d.game_id);
      if (g) d.event_label = (g.away + ' vs ' + g.home).slice(0, 120);
    }
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
    if (this.odds === null || this.stake === null) return false;
    if (decimalOdds(this.odds, this.oddsFormat) === null) {
      this.vm.error.set(
        'Cuota inválida. Decimal: mayor que 1. Americana: entero de -100 o menor, o +100 o mayor.',
      );
      return false;
    }
    if (
      await this.bets.create({
        selection_details: this.selections,
        odds_format: this.oddsFormat,
        league_tag: this.leagueTag,
        market_tag: this.marketTag,
        same_game_selections: this.betType === 'same_game' ? this.sameGameSelections : [],
        games: this.selectedGames.map((g) => g.id),
        legs: this.betType === 'parlay' ? this.legs : [],
        house_id: Number(this.selectedHouse),
        event: this.event,
        odds: this.odds,
        stake: this.stake,
        bet_type: this.betType,
        bonus: this.betType !== 'simple' ? (this.bonus ?? 0) : 0,
      })
    ) {
      this.selections = Array.from({ length: this.betType === 'simple' ? 1 : 2 }, () =>
        newSelection(sportForLeague(this.leagueTag)),
      );
      this.sameGameSelections = ['', ''];
      this.event = '';
      this.marketTag = 'Sin clasificar';
      this.selectedGames = [];
      this.bonus = 0;
      this.odds = null;
      this.legs = [
        { selection: '', odds: 2, status: 'pending' },
        { selection: '', odds: 2, status: 'pending' },
      ];
      this.updateOdds();
      this.stake = null;
      this.showResult('pending');
      return true;
    }
    return false;
  }
  reviewBet(b: Bet, status: BetResult, payout = 0) {
    this.vm.error.set('');
    const expected =
      status === 'won'
        ? (b.american_odds
            ? americanPayout(b.remaining_stake ?? b.stake, b.american_odds)
            : winningPayout(b.remaining_stake ?? b.stake, b.odds)) +
          Math.round(((b.bonus ?? 0) * (b.remaining_stake ?? b.stake)) / b.stake)
        : status === 'void'
          ? (b.remaining_stake ?? b.stake)
          : status === 'cashout'
            ? Math.round(payout * 100)
            : 0;
    this.review.set({
      title: `Marcar como ${this.vm.labels[status].toLowerCase()}`,
      message: `${b.event} · ${b.house}`,
      amount: this.vm.native(expected, b.currency),
      note: 'Retorno total que se sumará al saldo. Las correcciones posteriores quedan registradas en el libro de movimientos.',
      execute: () => this.bets.settle(b.id, status, payout),
    });
  }
  async confirmReview() {
    const review = this.review();
    if (review && (await review.execute())) {
      this.review.set(null);
      this.cashoutId = null;
      this.cashoutAmount = null;
    }
  }
}
