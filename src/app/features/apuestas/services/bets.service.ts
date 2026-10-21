import { toDatabaseSelectionDetail, type SelectionDetail } from './selection-detail';
import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { CreateBet, BetResult } from './bet.model';
import { decimalOdds } from '../../../shared/utils/odds.utils';
import { toDatabaseMarketTag, toDatabaseLeagueTag } from './bet-tags';

@Injectable({ providedIn: 'root' })
export class BetsService {
  private api = inject(ApiService);
  private state = inject(LedgerState);

  tags(id: number, revision: number, league_tag: string, market_tag: string, selection_details?: SelectionDetail[]) {
    const cleanLeague = toDatabaseLeagueTag(league_tag || 'Sin clasificar');
    const cleanMarket = toDatabaseMarketTag(market_tag || 'Sin clasificar', cleanLeague);
    const cleanDetails = selection_details ? selection_details.map((d) => toDatabaseSelectionDetail(d)) : undefined;

    return this.state.mutate(
      () =>
        this.api.request(`/bets/${id}/tags`, {
          revision,
          league_tag: cleanLeague,
          market_tag: cleanMarket,
          ...(cleanDetails?.length ? { selection_details: cleanDetails } : {}),
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
    // Keep linked_games locally and strip it from the REST payload to avoid unknown column errors
    const { linked_games, ...apiPayload } = data;
    const cleanLeagueTag = toDatabaseLeagueTag(data.league_tag || 'Sin clasificar');
    const cleanMarketTag = toDatabaseMarketTag(data.market_tag || 'Sin clasificar', cleanLeagueTag);
    const cleanDetails = (data.selection_details || []).map((d) =>
      toDatabaseSelectionDetail(d, data.linked_games)
    );

    const finalPayload = {
      ...apiPayload,
      league_tag: cleanLeagueTag,
      market_tag: cleanMarketTag,
      selection_details: cleanDetails,
    };

    return this.state.mutate(
      () => this.api.request('/bets', finalPayload),
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
            league_tag: cleanLeagueTag,
            market_tag: cleanMarketTag,
            bonus: Math.round((data.bonus ?? 0) * 100),
            bet_type: data.bet_type,
            status: 'pending',
            payout: 0,
            created: new Date().toISOString().slice(0, 19).replace('T', ' '),
            settled_at: null,
            legs: data.legs,
            selection_details: cleanDetails,
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
