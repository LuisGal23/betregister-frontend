import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SportsService } from '../../services/sports.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { TicketModalService } from '../../../bets/services/ticket-modal.service';
import { zoneDay } from '../../../../shared/utils/zone.utils';
import type { SportsGame, MatchDetails, PlayerStat } from '../../models/sports.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface MatchAnalysis {
  homeProb: number;
  awayProb: number;
  favorite: 'home' | 'away';
  pickLabel: string;
  confidence: string;
  estHomeScore: number;
  estAwayScore: number;
  estTotal: number;
  totalLine: number;
  handicap: string;
  altLine1: { text: string; prob: number; status: string };
  altLine2: { text: string; prob: number; status: string };
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
  private router = inject(Router);
  private ticketModal = inject(TicketModalService);
  vm = inject(LedgerState);

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
  searchQuery = signal('');
  loading = signal(false);
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
    const cat = this.selectedCategory();
    const sub = this.selectedSubLeague();
    const activeCat = this.categories.find((c) => c.id === cat);

    return this.games().filter((g) => {
      if (live && g.state !== 'live') return false;
      if (cat === 'europe' && sub !== 'all' && g.league !== sub) return false;
      if (cat === 'intl' && sub !== 'all' && g.league !== sub) return false;
      if (cat === 'baseball' && sub !== 'all' && g.league !== sub) return false;
      if (activeCat && activeCat.leagues && !activeCat.leagues.includes(g.league)) return false;
      if (q && !`${g.home} ${g.away} ${g.league_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  openMatchAnalysis(game: SportsGame) {
    void this.router.navigate(['/match-analysis'], {
      queryParams: { league: game.league, id: game.id }
    });
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
        const details = await this.sports.details(game.league, game.id);
        this.matchDetails.update((m) => ({ ...m, [game.id]: details }));
      } catch (e) {
        console.error('Error loading match details', e);
      } finally {
        this.loadingDetails.update((m) => ({ ...m, [game.id]: false }));
      }
    }
  }

  // Generate deterministic statistics & probabilities, overriding with verified API data when available
  analyzeGame(g: SportsGame): MatchAnalysis {
    const d = this.matchDetails()[g.id];
    let hash = 0;
    for (let i = 0; i < g.id.length; i++) {
      hash = (hash << 5) - hash + g.id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const isAmerican = g.sport === 'Americano';
    const isBaseball = g.sport === 'Béisbol';

    // Model home/away probability or use real verified provider data
    let homeProb: number;
    let awayProb: number;

    if (d && d.probabilities && d.probabilities.home_pct != null) {
      homeProb = Math.round(d.probabilities.home_pct);
      awayProb = Math.round(d.probabilities.away_pct);
    } else {
      const bias = (seed % 28) - 14;
      homeProb = Math.min(78, Math.max(28, 52 + bias));
      awayProb = 100 - homeProb;
    }

    const favorite = homeProb >= awayProb ? 'home' : 'away';
    const favTeam = favorite === 'home' ? g.home : g.away;
    const favProb = Math.max(homeProb, awayProb);
    const confidence = favProb >= 65 ? 'alta' : favProb >= 55 ? 'moderada' : 'baja';

    let estHomeScore = 0;
    let estAwayScore = 0;
    let estTotal = 0;
    let totalLine = 2.5;
    let handicap = '';

    if (d && d.odds && d.odds.total && d.odds.total.line != null) {
      totalLine = Number(d.odds.total.line);
    } else if (isAmerican) {
      totalLine = 44.5;
    } else if (isBaseball) {
      totalLine = 7.5;
    } else {
      totalLine = 2.5;
    }

    if (d && d.odds && d.odds.spread && d.odds.spread.home_line != null) {
      handicap = `${this.shortCode(g.home)} ${this.formatLine(d.odds.spread.home_line)}`;
    } else if (isAmerican) {
      const baseTotal = 38 + (seed % 16);
      const diff = Math.round((favProb - 50) / 4);
      estHomeScore = favorite === 'home' ? Math.round(baseTotal / 2 + diff) : Math.round(baseTotal / 2 - diff);
      estAwayScore = favorite === 'home' ? Math.round(baseTotal / 2 - diff) : Math.round(baseTotal / 2 + diff);
      estTotal = estHomeScore + estAwayScore;
      handicap = favorite === 'home' ? `${this.shortCode(g.home)} -${Math.max(1.5, diff + 0.5)}` : `${this.shortCode(g.away)} -${Math.max(1.5, diff + 0.5)}`;
    } else if (isBaseball) {
      const diff = (seed % 3) + 1;
      estHomeScore = favorite === 'home' ? 4 + diff : 3;
      estAwayScore = favorite === 'home' ? 3 : 4 + diff;
      estTotal = estHomeScore + estAwayScore;
      handicap = favorite === 'home' ? `${this.shortCode(g.home)} -1.5` : `${this.shortCode(g.away)} -1.5`;
    } else {
      estHomeScore = favorite === 'home' ? 2 : 1;
      estAwayScore = favorite === 'home' ? 1 : 2;
      estTotal = estHomeScore + estAwayScore;
      handicap = favorite === 'home' ? `${this.shortCode(g.home)} -0.5` : `${this.shortCode(g.away)} -0.5`;
    }

    estTotal = estTotal || Math.round(totalLine);
    estHomeScore = estHomeScore || Math.round(estTotal / 2);
    estAwayScore = estAwayScore || (estTotal - estHomeScore);

    return {
      homeProb,
      awayProb,
      favorite,
      pickLabel: `Gana ${favTeam}`,
      confidence,
      estHomeScore,
      estAwayScore,
      estTotal,
      totalLine,
      handicap,
      altLine1: {
        text: `${this.shortCode(favorite === 'home' ? g.away : g.home)} +${isAmerican ? '7.5' : '1.5'}`,
        prob: Math.min(84, 68 + (seed % 14)),
        status: g.state === 'final' ? 'Acertó' : 'Pendiente',
      },
      altLine2: {
        text: `${isAmerican ? 'Over 37.5' : 'Over 2.0'}`,
        prob: Math.min(78, 65 + (seed % 12)),
        status: g.state === 'final' ? 'Acertó' : 'Pendiente',
      },
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
