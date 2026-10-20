import { SelectionEditorComponent } from '../selection-editor/selection-editor.component';
import type { SelectionDetail } from '../../services/selection-detail';
import {
  Component,
  AfterViewInit,
  OnInit,
  OnDestroy,
  ElementRef,
  input,
  output,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Bet, BetLeg, BetResult } from '../../services/bet.model';
import { BetsService } from '../../services/bets.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { LEAGUE_TAGS, marketsForLeague, marketLabel } from '../../services/bet-tags';
@Component({
  selector: 'app-bet-management',
  imports: [FormsModule, SelectionEditorComponent],
  templateUrl: './bet-management.component.html',
})
export class BetManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  bet = input.required<Bet>();
  mode = input.required<'correct' | 'partial' | 'legs' | 'tags'>();
  leagueTags = LEAGUE_TAGS;
  marketLabel = marketLabel;
  marketOptions() {
    return marketsForLeague(this.leagueTag, this.marketTag);
  }
  setLeague(league: string) {
    this.leagueTag = league;
    if (!marketsForLeague(league).includes(this.marketTag)) this.marketTag = 'Sin clasificar';
  }
  leagueTag = 'Sin clasificar';
  marketTag = 'Sin clasificar';
  oddsFormat: 'decimal' | 'american' = 'decimal';
  dismiss = output();
  vm = inject(LedgerState);
  service = inject(BetsService);
  details: SelectionDetail[] = [];
  event = '';
  stake = 0;
  odds = 2;
  bonus = 0;
  payout = 0;
  reason = '';
  status: BetResult = 'void';
  legs: BetLeg[] = [];
  private opener = document.activeElement as HTMLElement | null;
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  ngOnInit() {
    const b = this.bet();
    this.details = structuredClone(b.selection_details ?? []);
    this.leagueTag = b.league_tag ?? 'Sin clasificar';
    this.marketTag = b.market_tag ?? 'Sin clasificar';
    this.oddsFormat = b.american_odds ? 'american' : 'decimal';
    this.event = b.event;
    this.stake = this.mode() === 'partial' ? 0 : b.stake / 100;
    this.odds = b.american_odds ?? Number(b.odds);
    this.bonus = (b.bonus ?? 0) / 100;
    this.status = b.status === 'pending' ? 'void' : b.status;
    this.payout = (b.payout - (b.partial_payout ?? 0)) / 100;
    this.legs = structuredClone(b.legs ?? []);
    this.vm.error.set('');
  }
  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
  }
  ngOnDestroy() {
    this.dialog().nativeElement.close();
    if (this.opener?.isConnected) this.opener.focus();
  }
  async save() {
    const b = this.bet();
    let ok = false;
    if (this.mode() === 'tags') {
      const markets = [...new Set(this.details.map((d) => d.market))];
      const market = this.details.length
        ? markets.length === 1 && this.leagueTag !== 'Mixto'
          ? markets[0]
          : 'Mixto'
        : this.marketTag;
      ok = await this.service.tags(b.id, b.revision ?? 0, this.leagueTag, market, this.details);
    } else if (this.mode() === 'partial')
      ok = await this.service.partial(b.id, b.revision ?? 0, this.stake, this.payout);
    else if (this.mode() === 'legs') ok = await this.service.legs(b.id, b.revision ?? 0, this.legs);
    else
      ok = await this.service.correct(b.id, {
        house_id: b.house_id,
        event: this.event,
        stake: this.stake,
        odds: this.odds,
        odds_format: this.oddsFormat,
        bonus: this.bonus,
        bet_type: b.bet_type ?? 'simple',
        status: this.status,
        payout: this.payout,
        reason: this.reason,
        revision: b.revision ?? 0,
        legs: this.legs,
        same_game_selections: b.same_game_selections ?? [],
        selection_details: b.selection_details ?? [],
        games: (b.linked_games ?? []).map((g) => g.id),
      });
    if (ok) this.dismiss.emit();
  }
}
