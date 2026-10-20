import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SportsService } from '../../services/sports.service';
import { PlayerMediaService } from '../../services/player-media.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { TicketModalService } from '../../../apuestas/services/ticket-modal.service';
import { CuotasStatsModalService } from '../../services/cuotas-stats-modal.service';
import { zoneDay } from '../../../../shared/utils/zone.utils';
import type { SportsGame, MatchDetails, PlayerStat, AIValueBetResponse, PredictionEvaluation } from '../../services/sports.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import {
  getStadium,
  getRecord,
  calculateUnifiedGameProbabilities,
  getUnifiedMatchPrediction,
  evaluatePrediction,
  getVerifiedTeamStars,
} from '../../../../shared/utils/match-analysis.utils';
import { getTeamLogo } from '../../../../shared/utils/team-logos.utils';

export interface MatchAnalysis {
  homeProb: number;
  drawProb: number | null;
  awayProb: number;
  favorite: 'home' | 'away' | 'draw';
  confidence: string;
}

@Component({
  selector: 'app-matches-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, IconComponent],
  templateUrl: './matches-page.component.html',
  host: { class: 'block w-full' },
})
export class MatchesPageComponent implements OnInit {
  private sports = inject(SportsService);
  private playerMedia = inject(PlayerMediaService);
  private router = inject(Router);
  private ticketModal = inject(TicketModalService);
  private cuotasModalService = inject(CuotasStatsModalService);
  vm = inject(LedgerState);

  // Cuotas y Estadísticas Modal state
  isModalOpen = signal(false);
  modalGame = signal<SportsGame | null>(null);

  // AI Predictions Cache and Post-Match Evaluation Map
  aiPredictions = signal<Record<string, AIValueBetResponse>>({});

  // Categories: NFL, NBA, Ligas Europeas, Selecciones / Amistosos, Liga MX, MLS, Béisbol
  categories = [
    { id: 'all', label: 'Todos' },
    { id: 'nfl', label: 'NFL', leagues: ['nfl'] },
    { id: 'nba', label: 'NBA', leagues: ['nba'] },
    { id: 'europe', label: 'Ligas Europeas', leagues: ['premier', 'laliga', 'champions', 'seriea', 'bundesliga', 'ligue1', 'europa'] },
    { id: 'intl', label: 'Selecciones / Amistosos', leagues: ['nations', 'concacaf-nations', 'friendlies', 'worldcup', 'euro', 'copa-america', 'gold-cup', 'qualifiers-uefa', 'qualifiers-conmebol', 'qualifiers-concacaf'] },
    { id: 'ligamx', label: 'Liga MX', leagues: ['ligamx'] },
    { id: 'mls', label: 'MLS', leagues: ['mls'] },
    { id: 'baseball', label: 'Béisbol (MLB / KBO)', leagues: ['mlb', 'kbo'] },
  ];

  europeanLeagues = [
    { id: 'all', label: 'Todas europeas' },
    { id: 'laliga', label: 'La Liga' },
    { id: 'premier', label: 'Premier League' },
    { id: 'champions', label: 'Champions League' },
    { id: 'seriea', label: 'Serie A' },
    { id: 'bundesliga', label: 'Bundesliga' },
    { id: 'ligue1', label: 'Ligue 1' },
    { id: 'europa', label: 'Europa League' },
  ];

  intlLeagues = [
    { id: 'all', label: 'Todos internacionales' },
    { id: 'nations', label: 'Nations League UEFA' },
    { id: 'concacaf-nations', label: 'Nations Concacaf' },
    { id: 'friendlies', label: 'Amistosos FIFA' },
    { id: 'qualifiers-uefa', label: 'Eliminatorias UEFA' },
    { id: 'qualifiers-conmebol', label: 'Eliminatorias CONMEBOL' },
    { id: 'qualifiers-concacaf', label: 'Eliminatorias Concacaf' },
  ];

  baseballLeagues = [
    { id: 'all', label: 'Todo béisbol' },
    { id: 'mlb', label: 'MLB' },
    { id: 'kbo', label: 'KBO' },
  ];

  selectedCategory = signal<string>('all');
  selectedSubLeague = signal<string>('all');
  selectedDate = signal<string>('');
  onlyLive = signal(false);
  hideFinished = signal(false);
  searchQuery = signal('');
  loading = signal(true);
  error = signal('');

  games = signal<SportsGame[]>([]);

  // Expanded match for stats, odds, and player props
  expandedMatchId = signal<string | null>(null);
  matchDetails = signal<Record<string, MatchDetails>>({});
  loadingDetails = signal<Record<string, boolean>>({});

  // Ticker for top quick match previews
  tickerMatches = computed(() => this.games().slice(0, 8));

  filteredGames = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const live = this.onlyLive();
    const hideFinal = this.hideFinished();
    const cat = this.selectedCategory();
    const sub = this.selectedSubLeague();
    const activeCat = this.categories.find((c) => c.id === cat);

    return this.games().filter((g) => {
      if (live && g.state !== 'live') return false;
      if (hideFinal && g.state === 'final') return false;
      if (cat === 'europe' && sub !== 'all' && g.league !== sub) return false;
      if (cat === 'intl' && sub !== 'all' && g.league !== sub) return false;
      if (cat === 'baseball' && sub !== 'all' && g.league !== sub) return false;
      if (activeCat && activeCat.leagues && !activeCat.leagues.includes(g.league)) return false;
      if (q && !`${g.home} ${g.away} ${g.league_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  formatRecommendedMarket(market?: string, game?: SportsGame | null, vb?: AIValueBetResponse | null): string {
    if (!game) return market || 'Selección de Valor';
    const raw = (market || '').trim();
    const home = game.home;
    const away = game.away;

    if (raw.toLowerCase().includes(home.toLowerCase()) || raw.toLowerCase().includes(away.toLowerCase())) {
      return raw;
    }
    if (
      raw.toLowerCase().includes('más de') ||
      raw.toLowerCase().includes('over') ||
      raw.toLowerCase().includes('menos de') ||
      raw.toLowerCase().includes('under') ||
      raw.toLowerCase().includes('spread')
    ) {
      return raw;
    }

    const mType = (vb?.market_type || '').toLowerCase();
    const reasoning = (vb?.tactical_reasoning || '').toLowerCase();

    if (mType === 'away_win' || reasoning.includes(away.toLowerCase())) {
      return `Victoria de ${away} (Moneyline)`;
    }
    if (mType === 'draw' || raw.toLowerCase().includes('empate')) {
      return 'Empate (Draw)';
    }
    if (mType === 'over_2_5') {
      return 'Más de 2.5 Goles (Over 2.5)';
    }
    if (mType === 'under_2_5') {
      return 'Menos de 2.5 Goles (Under 2.5)';
    }

    const p = calculateUnifiedGameProbabilities(game);
    const chosenTeam = p.favorite === 'away' ? away : home;
    return `Victoria de ${chosenTeam} (Moneyline)`;
  }

  getGamePrediction(g: SportsGame): AIValueBetResponse {
    return this.aiPredictions()[g.id] || getUnifiedMatchPrediction(g);
  }

  getPredictionEvaluation(g: SportsGame): PredictionEvaluation {
    const pred = this.getGamePrediction(g);
    return evaluatePrediction(pred, g);
  }

  predictionAuditSummary = computed(() => {
    const list = this.filteredGames();
    let won = 0;
    let lost = 0;
    let pending = 0;
    let live = 0;
    let netUnits = 0;

    for (const g of list) {
      const evalRes = this.getPredictionEvaluation(g);
      if (evalRes.status === 'WON') {
        won++;
        netUnits += (evalRes.profitUnits ?? 0.90);
      } else if (evalRes.status === 'LOST') {
        lost++;
        netUnits += (evalRes.profitUnits ?? -1.0);
      } else {
        if (g.state === 'live') live++;
        else pending++;
      }
    }

    const totalResolved = won + lost;
    const winRate = totalResolved > 0 ? Number(((won / totalResolved) * 100).toFixed(1)) : 0;
    const roi = totalResolved > 0 ? Number(((netUnits / totalResolved) * 100).toFixed(1)) : 0;

    return {
      totalGames: list.length,
      totalResolved,
      won,
      lost,
      pending,
      live,
      winRate,
      netUnits: Number(netUnits.toFixed(2)),
      roi,
      hasEvaluations: totalResolved > 0,
    };
  });

  openMatchAnalysis(game: SportsGame) {
    void this.router.navigate(['/partidos', game.league, game.id]);
  }

  openModal(game: SportsGame) {
    void this.router.navigate(['/partidos', game.league, game.id]);
  }

  stats = computed(() => {
    const all = this.games();
    return {
      total: all.length,
      live: all.filter((g) => g.state === 'live').length,
      scheduled: all.filter((g) => g.state === 'scheduled').length,
      final: all.filter((g) => g.state === 'final').length,
    };
  });

  todayStr = computed(() => zoneDay(new Date().toISOString(), this.vm.data().profile.timezone));

  currentPeriodLabel = computed(() => {
    const d = this.selectedDate() ? new Date(this.selectedDate() + 'T12:00:00Z') : new Date();
    const dayName = d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '').toUpperCase();
    const dayNum = d.getUTCDate();
    const month = d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '').toUpperCase();
    return `— ${dayName} ${dayNum} ${month}`;
  });

  getLogo(teamName: string, sport?: string, existing?: string | null): string {
    if (existing) return existing;
    return getTeamLogo(teamName, sport) || '';
  }

  getVenue(game: SportsGame): string {
    return game.venue || getStadium(game.home);
  }

  private getHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  getTeamRecord(game: SportsGame, isHome: boolean): string {
    const seed = this.getHash(game.id || game.home + game.away);
    if (isHome) {
      return game.home_record || getRecord(game.home, true, seed);
    }
    return game.away_record || getRecord(game.away, false, seed);
  }

  formatCardTopMeta(game: SportsGame): string {
    const venue = this.getVenue(game);
    if (!game.start) return venue;
    try {
      const d = new Date(game.start);
      const dayName = d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '').toUpperCase();
      const dayNum = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '').toUpperCase();
      const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${dayName} ${dayNum} · ${time} EN TU ZONA · ${venue}`;
    } catch {
      return venue;
    }
  }
  yesterdayStr = computed(() => {
    const t = this.todayStr();
    const d = new Date(t + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  tomorrowStr = computed(() => {
    const t = this.todayStr();
    const d = new Date(t + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  ngOnInit() {
    this.selectedDate.set(this.todayStr());
    void this.loadMatches();
  }

  setCategory(catId: string) {
    this.selectedCategory.set(catId);
    this.selectedSubLeague.set('all');
  }

  setSubLeague(leagueId: string) {
    this.selectedSubLeague.set(leagueId);
  }

  formatMatchDate(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const dayName = d.toLocaleDateString('es-MX', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
      const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${dayName} ${dayNum} · ${time} CDMX`.toUpperCase();
    } catch {
      return iso;
    }
  }

  onLogoError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) img.style.display = 'none';
  }

  selectNamedDay(target: 'yesterday' | 'today' | 'tomorrow') {
    if (target === 'yesterday') this.selectedDate.set(this.yesterdayStr());
    else if (target === 'today') this.selectedDate.set(this.todayStr());
    else if (target === 'tomorrow') this.selectedDate.set(this.tomorrowStr());
    void this.loadMatches();
  }

  setDateOffset(offsetDays: number) {
    const current = this.selectedDate() ? new Date(this.selectedDate() + 'T12:00:00Z') : new Date();
    current.setUTCDate(current.getUTCDate() + offsetDays);
    this.selectedDate.set(current.toISOString().slice(0, 10));
    void this.loadMatches();
  }

  teamColor(name: string, apiColor?: string | null): string {
    if (apiColor && apiColor.startsWith('#') && apiColor.length >= 4) {
      const hex = apiColor.replace('#', '');
      const num = parseInt(hex.length === 3 ? hex.split('').map(c => c+c).join('') : hex, 16);
      if (!isNaN(num)) {
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness > 30 && brightness < 235) {
          return apiColor;
        }
      }
    }

    const sportsPalette = [
      '#ef4444', '#0284c7', '#10b981', '#f59e0b',
      '#8b5cf6', '#06b6d4', '#ea580c', '#3b82f6',
      '#ec4899', '#14b8a6', '#f43f5e', '#6366f1'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
    }
    const idx = Math.abs(hash) % sportsPalette.length;
    return sportsPalette[idx];
  }

  cardAuraStyle(game: SportsGame): { [key: string]: string } {
    const homeCol = this.teamColor(game.home, game.home_color);
    const awayCol = this.teamColor(game.away, game.away_color);
    return {
      '--home-aura': homeCol,
      '--away-aura': awayCol,
    };
  }

  async loadMatches() {
    this.loading.set(true);
    this.error.set('');
    const day = this.selectedDate();
    
    // Determine which leagues to fetch
    const cat = this.selectedCategory();
    const active = this.categories.find((c) => c.id === cat);
    const targetLeagues = active && active.leagues 
      ? active.leagues 
      : ['nfl', 'nba', 'premier', 'laliga', 'champions', 'ligamx', 'mls', 'mlb', 'seriea', 'bundesliga', 'nations', 'friendlies'];

    try {
      const results: SportsGame[] = [];
      // Fetch in concurrent batches
      const batchSize = 4;
      for (let i = 0; i < targetLeagues.length; i += batchSize) {
        const batch = targetLeagues.slice(i, i + batchSize);
        const batchResponses = await Promise.all(
          batch.map(async (l) => {
            try {
              const res = await this.sports.events(l, day);
              return res?.events ?? [];
            } catch {
              return [];
            }
          })
        );
        for (const list of batchResponses) {
          results.push(...list);
        }
      }

      // Deduplicate by ID
      const seen = new Set<string>();
      const unique = results.filter((g) => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      });

      // Sort by start date/time
      unique.sort((a, b) => (a.start > b.start ? 1 : -1));
      this.games.set(unique);

      // 1. Initialize with pre-warmed predictions from DB cache (<30ms)
      const prewarmed = await this.sports.cachedPredictions();
      const initialPreds: Record<string, AIValueBetResponse> = { ...prewarmed, ...this.aiPredictions() };
      for (const g of unique) {
        if (!initialPreds[g.id]) {
          initialPreds[g.id] = getUnifiedMatchPrediction(g);
        }
      }
      this.aiPredictions.set(initialPreds);

      // 2. Pre-fetch player photos in the background via backend DB cache!
      const playerMetaToPreload: { name: string; player_id?: string; team?: string; sport?: string }[] = [];
      const seenNames = new Set<string>();
      for (const g of unique.slice(0, 16)) {
        const homeStars = getVerifiedTeamStars(g.home, g.sport, 'home');
        const awayStars = getVerifiedTeamStars(g.away, g.sport, 'away');
        homeStars.forEach((s) => {
          if (!seenNames.has(s.name)) {
            seenNames.add(s.name);
            playerMetaToPreload.push({ name: s.name, player_id: s.athlete_id, team: g.home, sport: g.sport });
          }
        });
        awayStars.forEach((s) => {
          if (!seenNames.has(s.name)) {
            seenNames.add(s.name);
            playerMetaToPreload.push({ name: s.name, player_id: s.athlete_id, team: g.away, sport: g.sport });
          }
        });
      }
      if (playerMetaToPreload.length > 0) {
        void this.playerMedia.preloadPlayers(playerMetaToPreload);
      }

      // 3. Asynchronously query backend value-bets in a single batched update
      const targetForAi = unique.slice(0, 12);
      const batchAiUpdates: Record<string, AIValueBetResponse> = {};
      await Promise.allSettled(
        targetForAi.map(async (g) => {
          try {
            const vb = await this.sports.valueBet(g.league, g.id, g.home, g.away, g.start);
            if (vb) {
              batchAiUpdates[g.id] = vb;
            }
          } catch {}
        })
      );
      if (Object.keys(batchAiUpdates).length) {
        this.aiPredictions.update((m) => ({ ...m, ...batchAiUpdates }));
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudieron cargar los partidos del día.');
    } finally {
      this.loading.set(false);
    }
  }

  // Toggle details (real odds, probabilities & player statistics)
  async toggleDetails(game: SportsGame) {
    if (this.expandedMatchId() === game.id) {
      this.expandedMatchId.set(null);
      return;
    }
    this.expandedMatchId.set(game.id);
    if (!this.matchDetails()[game.id]) {
      this.loadingDetails.update((m) => ({ ...m, [game.id]: true }));
      try {
        const details = await this.sports.details(game.league, game.id, game);
        this.matchDetails.update((m) => ({ ...m, [game.id]: details }));
      } catch (e) {
        console.error('Error loading match details', e);
      } finally {
        this.loadingDetails.update((m) => ({ ...m, [game.id]: false }));
      }
    }
  }

  // Unified, 100% consistent probabilities matching modal and bookmaker lines
  analyzeGame(g: SportsGame): MatchAnalysis {
    const p = calculateUnifiedGameProbabilities(g);
    return {
      homeProb: Math.round(p.homeProb),
      drawProb: p.drawProb != null ? Math.round(p.drawProb) : null,
      awayProb: Math.round(p.awayProb),
      favorite: p.favorite,
      confidence: p.confidence,
    };
  }

  shortCode(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0].slice(0, 2) + parts[1].slice(0, 1)).toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
  }

  formatLine(line: any): string {
    const n = Number(line);
    if (isNaN(n)) return String(line ?? '');
    return n > 0 ? `+${n}` : `${n}`;
  }

  // Preselect match and open Ticket Modal directly
  addToTicket(game: SportsGame) {
    this.ticketModal.open(game);
  }

  // Direct betting on Moneyline from Sportsbook Odds
  addMoneylineBet(game: SportsGame, side: 'home' | 'away' | 'draw', oddDec?: number | null) {
    const pickName = side === 'home' ? game.home : side === 'away' ? game.away : 'Empate';
    const pickVal = side === 'home' ? 'Local' : side === 'away' ? 'Visitante' : 'Empate';
    this.ticketModal.open({
      game,
      market: 'ML',
      pick: pickVal,
      odds: oddDec ? Number(oddDec) : null,
      eventLabel: `${game.home} vs ${game.away} · Gana ${pickName}`,
    });
  }

  // Direct betting on Spread (Hándicap)
  addSpreadBet(game: SportsGame, side: 'home' | 'away', line: any, oddDec?: number | null) {
    const teamName = side === 'home' ? game.home : game.away;
    const numLine = Number(line) || 0;
    this.ticketModal.open({
      game,
      market: 'Hándicap',
      pick: side === 'home' ? 'Local' : 'Visitante',
      line: numLine,
      odds: oddDec ? Number(oddDec) : null,
      eventLabel: `${teamName} (${numLine > 0 ? '+' : ''}${numLine})`,
    });
  }

  // Direct betting on Over / Under
  addTotalBet(game: SportsGame, side: 'over' | 'under', line: any, oddDec?: number | null) {
    const numLine = Number(line) || 0;
    const market = game.sport === 'Americano' ? 'Puntos' : game.sport === 'Béisbol' ? 'Carreras' : 'Goles';
    const pick = side === 'over' ? 'Más de' : 'Menos de';
    this.ticketModal.open({
      game,
      market,
      pick,
      line: numLine,
      odds: oddDec ? Number(oddDec) : null,
      eventLabel: `${game.home} vs ${game.away} · ${pick} ${numLine} ${market}`,
    });
  }

  // Direct betting on Player Props
  addPlayerBet(game: SportsGame, player: PlayerStat, statCategory: string, line?: number, pick = 'Más de', odds = 1.85) {
    let market = 'Otro';
    const catLower = (statCategory || '').toLowerCase();
    if (catLower.includes('triple')) market = 'Triples';
    else if (catLower.includes('rebote')) market = 'Rebotes';
    else if (catLower.includes('asistencia')) market = 'Asistencias';
    else if (catLower.includes('punto')) market = 'Puntos';
    else if (catLower.includes('yarda')) market = 'Yardas';
    else if (catLower.includes('gol')) market = 'Goles';
    else if (catLower.includes('hit')) market = 'Hits';
    else if (catLower.includes('ponche')) market = 'Ponches';

    this.ticketModal.open({
      game,
      market,
      pick: market === 'Otro' ? '' : pick,
      line: line ?? null,
      odds: Number(odds) || 1.85,
      description: `${player.name} (${player.position || player.team_name}): ${statCategory} ${pick} ${line ?? ''}`.trim(),
      eventLabel: `${player.name} · ${statCategory} (${game.home} vs ${game.away})`,
    });
  }
}
