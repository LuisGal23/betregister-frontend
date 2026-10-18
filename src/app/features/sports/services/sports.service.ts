import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { League, Scoreboard, BetScores, SportsGame, MatchDetails } from '../models/sports.model';
@Injectable({ providedIn: 'root' })
export class SportsService {
  private api = inject(ApiService);
  readonly pendingMatch = signal<SportsGame | null>(null);

  setPendingMatch(game: SportsGame | null) {
    this.pendingMatch.set(game);
  }

  leagues() { return this.api.request<{leagues: League[]}>('/sports/leagues'); }
  events(league: string, day: string) { return this.api.request<Scoreboard>(`/sports/events?league=${encodeURIComponent(league)}&day=${encodeURIComponent(day)}`, undefined, 30000); }
  details(league: string, id: string) { return this.api.request<MatchDetails>(`/sports/event-details?league=${encodeURIComponent(league)}&id=${encodeURIComponent(id)}`, undefined, 30000); }
  scores(id: number) { return this.api.request<BetScores>(`/sports/bets/${id}`, undefined, 90000); }
}
