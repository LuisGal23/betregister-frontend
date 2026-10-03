import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { League, Scoreboard, BetScores } from '../models/sports.model';
@Injectable({ providedIn: 'root' })
export class SportsService {
  private api = inject(ApiService);
  leagues() { return this.api.request<{leagues: League[]}>('/sports/leagues'); }
  events(league: string, day: string) { return this.api.request<Scoreboard>(`/sports/events?league=${encodeURIComponent(league)}&day=${encodeURIComponent(day)}`, undefined, 30000); }
  scores(id: number) { return this.api.request<BetScores>(`/sports/bets/${id}`, undefined, 90000); }
}
