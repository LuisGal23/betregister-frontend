import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SportsService } from '../../services/sports.service';
import { PlayerMediaService } from '../../services/player-media.service';
import { TicketModalService } from '../../../apuestas/services/ticket-modal.service';
import type {
  SportsGame,
  MatchDetails,
  AIValueBetResponse,
  AlternativeMarketOption,
  PlayerStat,
  InjuryReportItem,
  H2HMatch,
} from '../../services/sports.model';
import {
  generateDeepAnalysis,
  getUnifiedMatchPrediction,
  calculateUnifiedGameProbabilities,
  getStadium,
} from '../../../../shared/utils/match-analysis.utils';
import { getTeamLogo } from '../../../../shared/utils/team-logos.utils';

@Component({
  selector: 'app-match-detail-page',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, IconComponent],
  templateUrl: './match-detail-page.component.html',
  host: { class: 'block w-full min-h-screen pb-16' },
})
export class MatchDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private sports = inject(SportsService);
  private playerMedia = inject(PlayerMediaService);
  private ticketModal = inject(TicketModalService);

  league = signal<string>('');
  matchId = signal<string>('');

  game = signal<SportsGame | null>(null);
  details = signal<MatchDetails | null>(null);
  aiValueBet = signal<AIValueBetResponse | null>(null);

  loading = signal<boolean>(true);
  loadingAi = signal<boolean>(false);
  activeTab = signal<'analisis' | 'alineaciones' | 'h2h'>('analisis');

  // Unified probabilities
  probs = computed(() => {
    const g = this.game();
    if (!g) return { homeProb: 50, awayProb: 50, drawProb: null, favorite: 'home' };
    return calculateUnifiedGameProbabilities(g);
  });

  stadium = computed(() => {
    const g = this.game();
    if (!g) return '';
    return getStadium(g.home);
  });

  // Top 3 alternative options with probabilities
  alternativeOptions = computed<AlternativeMarketOption[]>(() => {
    const ai = this.aiValueBet();
    if (ai?.alternative_options && ai.alternative_options.length) {
      return ai.alternative_options.slice(0, 3);
    }
    const g = this.game();
    if (!g) return [];
    const unified = getUnifiedMatchPrediction(g);
    return unified.alternative_options || [];
  });

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const leagueParam = params.get('league') || 'premier';
      const idParam = params.get('id') || '';
      this.league.set(leagueParam);
      this.matchId.set(idParam);

      if (idParam) {
        void this.loadMatchData(leagueParam, idParam);
      }
    });
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigate(['/pronosticos']);
    }
  }

  async loadMatchData(league: string, matchId: string) {
    this.loading.set(true);

    try {
      // 1. Fetch deep details from backend (cached)
      const d = await this.sports.details(league, matchId);
      this.details.set(d);
      if (d?.summary) {
        this.game.set(d.summary);
      }

      // Preload player images
      if (d) {
        const rosterMeta: { name: string; player_id?: string | null; team?: string; sport?: string }[] = [];
        const homeName = d.summary?.home || '';
        const awayName = d.summary?.away || '';
        const sportName = d.sport || d.summary?.sport || 'Fútbol';

        d.star_players?.forEach((s) =>
          rosterMeta.push({
            name: s.name,
            player_id: s.athlete_id,
            team: s.team_side === 'home' ? homeName : awayName,
            sport: sportName,
          })
        );
        d.players?.forEach((p) =>
          rosterMeta.push({
            name: p.name,
            player_id: p.athlete_id,
            team: p.team_side === 'home' ? homeName : awayName,
            sport: sportName,
          })
        );
        if (rosterMeta.length) {
          void this.playerMedia.preloadPlayers(rosterMeta);
        }
      }

      // 2. Fetch AI value-bet & alternatives
      const g = d?.summary;
      if (g) {
        // Start with unified fallback instantly
        this.aiValueBet.set(getUnifiedMatchPrediction(g));

        // Async fetch server Gemini prediction
        this.sports
          .valueBet(league, matchId, g.home, g.away, g.start)
          .then((vb) => {
            if (vb) {
              this.aiValueBet.set(vb);
            }
          })
          .catch(() => {});
      }
    } catch {
      // Fallback synthetic details if network is offline
      const syntheticGame: SportsGame = {
        id: matchId,
        league,
        league_name: league.toUpperCase(),
        sport: 'Fútbol',
        home: 'Local',
        away: 'Visitante',
        start: new Date().toISOString(),
        state: 'scheduled',
        home_score: null,
        away_score: null,
        detail: '',
        provider: 'synthetic',
      };
      this.game.set(syntheticGame);
      const full = generateDeepAnalysis(syntheticGame);
      this.details.set(full);
      this.aiValueBet.set(getUnifiedMatchPrediction(syntheticGame));
    } finally {
      this.loading.set(false);
    }
  }

  async refreshAiPrediction() {
    const g = this.game();
    if (!g) return;
    this.loadingAi.set(true);
    try {
      const vb = await this.sports.valueBet(g.league, g.id, g.home, g.away, g.start, true);
      if (vb) {
        this.aiValueBet.set(vb);
      }
    } catch {
      // Keep existing
    } finally {
      this.loadingAi.set(false);
    }
  }

  addToTicket(market: string, pick: string, odds: number, label: string, line: number | null = null) {
    const g = this.game();
    if (!g) return;

    this.ticketModal.open({
      game: g,
      market,
      pick,
      line,
      odds,
      eventLabel: `${g.away} vs ${g.home} · ${label}`,
    });
  }

  getLogo(teamName: string, sport?: string, existing?: string | null): string {
    if (existing) return existing;
    return getTeamLogo(teamName, sport) || '';
  }

  onPlayerImgError(event: Event, name?: string) {
    const img = event.target as HTMLImageElement;
    if (!img || img.src.includes('ui-avatars.com')) return;
    const clean = (name || 'Jugador').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=1e293b&color=10b981&bold=true&size=256`;
  }
}