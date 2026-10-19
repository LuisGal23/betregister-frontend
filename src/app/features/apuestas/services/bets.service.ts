import type { SelectionDetail } from './selection-detail';
import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { CreateBet, BetResult } from './bet.model';
import { decimalOdds } from '../../../shared/utils/odds.utils';

@Injectable({ providedIn: 'root' })
export class BetsService {
  private api = inject(ApiService);
  private state = inject(LedgerState);

  tags(id: number, revision: number, league_tag: string, market_tag: string, selection_details?: SelectionDetail[]) {
    return this.state.mutate(
      () =>
        this.api.request(`/bets/${id}/tags`, {
          revision,
          league_tag,
          market_tag,
          ...(selection_details?.length ? { selection_details } : {}),
        }),
      'Etiquetas actualizadas.',
    );
  }

  setHistory(id: number, hidden: boolean) {
    return this.state.mutate(
      () => this.api.request(`/bets/${id}/history`, { hidden }),
      hidden ? 'Apuesta eliminada del historial. Saldo y estadísticas conservados.' : 'Apuesta restaurada en el historial.',
    );
  }

  create(data: CreateBet) {
    return this.state.mutate(
      () => this.api.request('/bets', data),
      'Apuesta registrada.',
      (dashboard) => {
        const house = dashboard.houses.find((h) => h.id === data.house_id);
        if (house) {
          const stake = Math.round(data.stake * 100);
          house.balance -= stake;
          house.pending += stake;
          dashboard.bets.unshift({
            id: -Date.now(),
            house_id: house.id,
            house: house.name,
            currency: house.currency,
            event: data.event,
            stake,
            odds: String(decimalOdds(data.odds, data.odds_format ?? 'decimal')),
            american_odds: data.odds_format === 'american' ? data.odds : null,
            league_tag: data.league_tag,
            market_tag: data.market_tag,
            bonus: Math.round((data.bonus ?? 0) * 100),
            bet_type: data.bet_type,
            status: 'pending',
            payout: 0,
            created: new Date().toISOString().slice(0, 19).replace('T', ' '),
            settled_at: null,
            legs: data.legs,
            selection_details: data.selection_details,
            same_game_selections: data.same_game_selections,
            linked_games: data.linked_games,
            remaining_stake: stake,
          });
        }
        return dashboard;
      },
    );
  }

  partial(id: number, revision: number, stake: number, payout: number) {
    return this.state.mutate(
      () => this.api.request(`/bets/${id}/partial-cashout`, { revision, stake, payout }),
      'Cashout parcial guardado.',
    );
  }

  correct(id: number, data: unknown) {
    return this.state.mutate(
      () => this.api.request(`/bets/${id}/correct`, data),
      'Corrección registrada en el libro de movimientos.',
    );
  }

  legs(id: number, revision: number, legs: unknown) {
    return this.state.mutate(
      () => this.api.request(`/bets/${id}/legs`, { revision, legs }),
      'Selecciones actualizadas y cuota recalculada.',
    );
  }

  settle(id: number, status: BetResult, payout = 0) {
    return this.state.mutate(
      () => this.api.request(`/bets/${id}/settle`, { status, payout }),
      'Resultado guardado.',
    );
  }
}
