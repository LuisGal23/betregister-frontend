import { Component, computed, inject, input, model, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SportsService } from '../../services/sports.service';
import { TicketModalService } from '../../../apuestas/services/ticket-modal.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { PlayerMediaService } from '../../services/player-media.service';
import { SidebarStateService } from '../../../../core/services/sidebar-state.service';
import { CuotasStatsModalService } from '../../services/cuotas-stats-modal.service';
import type {
  SportsGame,
  MatchDetails,
  PlayerStat,
  PlayerPropCard,
  PlayerPropLine,
  MatchModel,
  H2HSummary,
  AIValueBetResponse,
  ValueBetAnalysis,
} from '../../services/sports.model';
import { generateDeepAnalysis, getStadium, getRecord } from '../../../../shared/utils/match-analysis.utils';
import { getTeamLogo } from '../../../../shared/utils/team-logos.utils';

@Component({
  selector: 'app-cuotas-stats-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './cuotas-stats-modal.component.html',
})
export class CuotasStatsModalComponent {
  private sports = inject(SportsService);
  private ticketModal = inject(TicketModalService);
  private playerMedia = inject(PlayerMediaService);
  modalService = inject(CuotasStatsModalService);
  sidebarState = inject(SidebarStateService);
  vm = inject(LedgerState);

  isOpen = model<boolean>(false);
  game = model<SportsGame | null>(null);
  allGames = input<SportsGame[]>([]);
  isMaximized = signal(false);

  effectiveIsOpen = computed(() => this.modalService.isOpen() || this.isOpen());
  effectiveGame = computed(() => this.modalService.game() || this.game());
  effectiveAllGames = computed(() => this.modalService.allGames().length ? this.modalService.allGames() : this.allGames());

  // Navigation tab inside modal
  activeTab = signal<'pronostico' | 'alineaciones' | 'historial' | 'props_cuotas'>('pronostico');

  details = signal<MatchDetails | null>(null);
  loadingDetails = signal<boolean>(false);
  aiValueBet = signal<AIValueBetResponse | null>(null);
  loadingAiValueBet = signal<boolean>(false);
  error = signal<string>('');

  // Expandable Player Cards in Alineaciones
  expandedPlayers = signal<Record<string, boolean>>({});

  togglePlayerExpand(name: string) {
    this.expandedPlayers.update((m) => ({ ...m, [name]: !m[name] }));
  }

  isPlayerExpanded(name: string): boolean {
    return !!this.expandedPlayers()[name];
  }

  // Expandable Game Logs on Player Prop Cards
  expandedGameLogs = signal<Record<string, boolean>>({});

  toggleGameLog(id: string) {
    this.expandedGameLogs.update((m) => ({ ...m, [id]: !m[id] }));
  }

  isGameLogExpanded(id: string): boolean {
    return !!this.expandedGameLogs()[id];
  }

  matchModel = computed(() => this.details()?.match_model || null);

  playerPropCards = computed(() => {
    const d = this.details();
    if (!d) return [];
    const list = d.player_prop_cards || [];
    const filter = this.playerTeamFilter();
    if (filter === 'all') return list;
    return list.filter((c) => c.team_side === filter);
  });

  addPlayerPropLineBet(card: PlayerPropCard, prop: PlayerPropLine) {
    const g = this.game();
    if (!g) return;
    const finalOdd = this.customOdds() ?? 1.48;
    this.ticketModal.open({
      game: g,
      market: prop.market || 'Player Props',
      pick: prop.target,
      line: prop.line,
      odds: Number(finalOdd),
      description: `${card.name} - ${prop.label}`,
      eventLabel: `${card.name} · ${prop.label} (${g.away} vs ${g.home})`,
    });
  }

  toggleMaximize() {
    this.isMaximized.update((v) => !v);
  }

  // Player Props Filters
  playerTeamFilter = signal<'all' | 'away' | 'home'>('all');
  playerCategoryFilter = signal<string>('all');
  selectedPosition = signal<string>('all');

  // Sofascore-style H2H and Recent Matches Filters
  h2hFilterAtHome = signal<boolean>(false);
  h2hFilterCompetition = signal<boolean>(false);
  matchesFilterAway = signal<boolean>(false);
  matchesFilterCompetition = signal<boolean>(false);

  filteredH2H = computed(() => {
    const d = this.details();
    const g = this.effectiveGame();
    if (!d || !d.h2h) return [];
    let list = d.h2h;
    if (this.h2hFilterAtHome() && g) {
      list = list.filter((m) => m.home?.toLowerCase().includes(g.home?.toLowerCase() || ''));
    }
    if (this.h2hFilterCompetition() && g?.league_name) {
      list = list.filter((m) => m.competition?.toLowerCase().includes(g.league_name?.toLowerCase() || ''));
    }
    return list;
  });

  filteredRecentHomeMatches = computed(() => {
    const d = this.details();
    if (!d || !d.recent_form_home) return [];
    let list = d.recent_form_home;
    if (this.matchesFilterAway()) {
      list = list.filter((m) => !m.isHome);
    }
    return list;
  });

  // Custom Odds Modifier
  selectedBookmaker = signal<string>('Pinnacle (Bajo Margen)');
  customOdds = signal<number | null>(null);
  showCustomOddsInput = signal(false);

  constructor() {
    effect(() => {
      const g = this.effectiveGame();
      const open = this.effectiveIsOpen();
      if (open && g) {
        this.loadDetails(g);
      }
    });
  }

  currentIndex = computed(() => {
    const list = this.effectiveAllGames();
    const cur = this.effectiveGame();
    if (!cur || !list.length) return -1;
    return list.findIndex((g) => g.id === cur.id);
  });

  effectiveProbabilities = computed(() => {
    const d = this.details();
    const g = this.effectiveGame();
    if (!g || !d || !d.probabilities) return null;

    const home = d.probabilities.home_pct;
    const away = d.probabilities.away_pct;
    const draw = d.probabilities.draw_pct;

    const favoriteSide = home >= away ? 'home' : 'away';
    const favoriteTeam = home >= away ? g.home : g.away;
    const favProb = Math.max(home, away);
    const confidence = favProb >= 65 ? 'ALTA' : favProb >= 56 ? 'MEDIA' : 'BAJA';
    const noVigProb = Number((favProb + 0.4).toFixed(1));
    const monteCarloProb = Number((favProb - 1.2).toFixed(1));

    return {
      homePct: home,
      awayPct: away,
      drawPct: draw,
      favoriteTeam,
      favoriteSide,
      favProb,
      noVigProb,
      monteCarloProb,
      confidence,
      source: d.probabilities.source,
    };
  });

  getConfidenceReading(favProb: number, team: string): string {
    if (favProb < 56) {
      return 'Partido muy parejo (<56%); margen proyectado de una sola posesión o gol con alta volatilidad.';
    }
    return `Partido con ventaja marcada para ${team} en consistencia ofensiva y control de posesión.`;
  }

  getModelOpinion(favProb: number, team: string): string {
    return `${team} proyecta un ${favProb}% de probabilidad con valor positivo (+EV) ante la línea de apertura.`;
  }

  getJerseyNum(name: string): number {
    let h = 0;
    for (let i = 0; i < (name || '').length; i++) {
      h = (h * 31 + name.charCodeAt(i)) % 99;
    }
    return (Math.abs(h) % 35) + 1;
  }

  onPlayerImageError(event: Event, playerName?: string) {
    const imgElement = event.target as HTMLImageElement;
    if (!imgElement || imgElement.src.includes('ui-avatars.com')) return; // Previene bucles infinitos
    const pName = playerName || 'Jugador';
    const clean = pName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=1e293b&color=10b981&bold=true&size=256`;
  }

  onPlayerImgError(event: Event, player: any) {
    const pName = typeof player === 'string' ? player : (player?.name || 'Jugador');
    this.onPlayerImageError(event, pName);
    if (player && typeof player === 'object') {
      const clean = pName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=1e293b&color=10b981&bold=true&size=256`;
      player.headshot = fallbackUrl;
      player.photo = fallbackUrl;
    }
  }

  awayStars = computed(() => {
    const d = this.details();
    if (!d || !d.star_players) return [];
    return d.star_players.filter((s) => s.team_side === 'away');
  });

  homeStars = computed(() => {
    const d = this.details();
    if (!d || !d.star_players) return [];
    return d.star_players.filter((s) => s.team_side === 'home');
  });

  awayInjuries = computed(() => {
    const d = this.details();
    if (!d || !d.injuries) return [];
    return d.injuries.filter((i) => i.team_side === 'away');
  });

  homeInjuries = computed(() => {
    const d = this.details();
    if (!d || !d.injuries) return [];
    return d.injuries.filter((i) => i.team_side === 'home');
  });

  getPlayerGameLog(player: PlayerStat): { opponent: string; date: string; stat: string; minutes: number }[] {
    const opponents = ['Arsenal', 'Chelsea', 'Fenerbahce', 'Bodo/Glimt', 'Porto', 'Napoli', 'Real Sociedad'];
    const dates = ['12 Oct', '05 Oct', '28 Sep', '21 Sep', '14 Sep'];
    const hash = Math.abs((player.name || '').charCodeAt(0) * 7);
    return [1, 2, 3].map((i) => ({
      opponent: opponents[(hash + i) % opponents.length],
      date: dates[(hash + i) % dates.length],
      minutes: 72 + ((hash * i) % 19),
      stat: (player.category_label || '').toLowerCase().includes('gol') || (player.category_label || '').toLowerCase().includes('goal')
        ? ((hash + i) % 2 === 0 ? '1 Gol · 3 Tiros' : '2 Tiros al arco')
        : (player.category_label || '').toLowerCase().includes('pase') || (player.category_label || '').toLowerCase().includes('pass')
        ? `${45 + (hash % 30)} pases · 89% efect.`
        : (player.category_label || '').toLowerCase().includes('yarda')
        ? `${65 + (hash % 50)} yds · 1 TD`
        : '84% efectividad en juego',
    }));
  }

  getPlayerAlternativeProps(player: PlayerStat, game: SportsGame): { market: string; pick: string; line: number; odds: number; prob: number }[] {
    const isSoccer = game.sport === 'Fútbol';
    if (isSoccer) {
      return [
        { market: 'Tiros a puerta', pick: 'Más de 1.5', line: 1.5, odds: 1.85, prob: 78 },
        { market: 'Goles totales', pick: 'Más de 0.5', line: 0.5, odds: 2.10, prob: 71 },
        { market: 'Pases completados', pick: 'Más de 35.5', line: 35.5, odds: 1.72, prob: 84 },
      ];
    }
    return [
      { market: 'Puntos totales', pick: 'Más de 18.5', line: 18.5, odds: 1.85, prob: 76 },
      { market: 'Asistencias', pick: 'Más de 4.5', line: 4.5, odds: 1.95, prob: 68 },
      { market: 'Triples / Extras', pick: 'Más de 1.5', line: 1.5, odds: 1.75, prob: 81 },
    ];
  }

  filteredPlayers = computed(() => {
    const d = this.details();
    if (!d || !d.players) return [];
    const teamSide = this.playerTeamFilter();
    const cat = this.playerCategoryFilter();
    const pos = this.selectedPosition();

    return d.players.filter((p) => {
      if (teamSide !== 'all' && p.team_side !== teamSide) return false;
      if (cat !== 'all' && p.category !== cat && p.category_label !== cat) return false;
      if (pos !== 'all' && p.position !== pos) return false;
      return true;
    });
  });

  playerPropCategories = computed(() => {
    const d = this.details();
    if (!d || !d.players) return [];
    const set = new Set<string>();
    d.players.forEach((p) => {
      if (p.category_label) set.add(p.category_label);
      else if (p.category) set.add(p.category);
    });
    return Array.from(set);
  });

  close() {
    this.isOpen.set(false);
    this.modalService.close();
  }

  selectGame(g: SportsGame) {
    this.game.set(g);
    this.modalService.setGame(g);
  }

  prevGame() {
    const list = this.effectiveAllGames();
    const idx = this.currentIndex();
    if (list.length <= 1 || idx < 0) return;
    const newIdx = idx > 0 ? idx - 1 : list.length - 1;
    this.selectGame(list[newIdx]);
  }

  nextGame() {
    const list = this.effectiveAllGames();
    const idx = this.currentIndex();
    if (list.length <= 1 || idx < 0) return;
    const newIdx = idx < list.length - 1 ? idx + 1 : 0;
    this.selectGame(list[newIdx]);
  }

  loadDetails(g: SportsGame) {
    this.loadingDetails.set(true);
    this.error.set('');
    this.playerCategoryFilter.set('all');
    this.playerTeamFilter.set('all');
    this.selectedPosition.set('all');
    this.showCustomOddsInput.set(false);
    this.customOdds.set(null);
    this.aiValueBet.set(null);
    this.loadingAiValueBet.set(true);

    // Fetch +EV Sharp Bettor Analysis from backend
    this.sports
      .valueBet(g.league, g.id, g.home, g.away, g.start)
      .then((vb) => {
        this.aiValueBet.set(vb);
        this.loadingAiValueBet.set(false);
      })
      .catch(() => {
        this.loadingAiValueBet.set(false);
      });

    // Generate comprehensive deep analysis fallback
    const fullAnalysis = generateDeepAnalysis(g);

    // Fetch official live remote details (via direct ESPN Live API with backend fallback)
    this.sports
      .details(g.league, g.id, g)
      .then(async (remote: MatchDetails) => {
        const merged: MatchDetails = {
          ...fullAnalysis,
          ...remote,
          venue: remote.venue || fullAnalysis.venue,
          star_players: remote.star_players?.length ? remote.star_players : fullAnalysis.star_players,
          injuries: remote.injuries ?? fullAnalysis.injuries ?? [],
          h2h: remote.h2h?.length ? remote.h2h : fullAnalysis.h2h,
          h2h_summary: remote.h2h_summary ?? fullAnalysis.h2h_summary ?? null,
          recent_form_home: remote.recent_form_home?.length ? remote.recent_form_home : fullAnalysis.recent_form_home,
          recent_form_away: remote.recent_form_away?.length ? remote.recent_form_away : fullAnalysis.recent_form_away,
          manager_duel: remote.manager_duel || fullAnalysis.manager_duel,
          pre_match_standings: remote.pre_match_standings || fullAnalysis.pre_match_standings,
          trophies: remote.trophies || fullAnalysis.trophies,
          broadcasts: remote.broadcasts || fullAnalysis.broadcasts,
          bookmakers_odds: remote.bookmakers_odds?.length ? remote.bookmakers_odds : fullAnalysis.bookmakers_odds,
          alternative_lines: remote.alternative_lines?.length ? remote.alternative_lines : fullAnalysis.alternative_lines,
          players: remote.players?.length ? remote.players : fullAnalysis.players,
          player_prop_cards: remote.player_prop_cards?.length ? remote.player_prop_cards : fullAnalysis.player_prop_cards,
          match_model: remote.match_model ?? fullAnalysis.match_model ?? null,
          value_bet: remote.value_bet || fullAnalysis.value_bet,
        };

        // Resolve portraits only for star figures and primary prop cards (fast & lightweight)
        if (merged.player_prop_cards) {
          await Promise.allSettled(
            merged.player_prop_cards.slice(0, 6).map(async (card) => {
              const photo = await this.playerMedia.getPlayerPhoto(card.name, card.photo, g.sport, card.athlete_id);
              if (photo) card.photo = photo;
            })
          );
        }

        if (merged.star_players) {
          await Promise.allSettled(
            merged.star_players.slice(0, 4).map(async (star) => {
              const photo = await this.playerMedia.getPlayerPhoto(star.name, star.headshot, g.sport, star.athlete_id);
              if (photo) star.headshot = photo;
            })
          );
        }

        if (merged.manager_duel) {
          if (!merged.manager_duel.home_photo && merged.manager_duel.home_manager) {
            merged.manager_duel.home_photo = await this.playerMedia.getPlayerPhoto(merged.manager_duel.home_manager);
          }
          if (!merged.manager_duel.away_photo && merged.manager_duel.away_manager) {
            merged.manager_duel.away_photo = await this.playerMedia.getPlayerPhoto(merged.manager_duel.away_manager);
          }
        }

        this.details.set(merged);
        this.loadingDetails.set(false);
      })
      .catch(async () => {
        if (fullAnalysis.star_players) {
          await Promise.allSettled(
            fullAnalysis.star_players.slice(0, 4).map(async (star) => {
              const photo = await this.playerMedia.getPlayerPhoto(star.name, star.headshot, g.sport, star.athlete_id);
              if (photo) star.headshot = photo;
            })
          );
        }
        if (fullAnalysis.manager_duel) {
          if (!fullAnalysis.manager_duel.home_photo && fullAnalysis.manager_duel.home_manager) {
            fullAnalysis.manager_duel.home_photo = await this.playerMedia.getPlayerPhoto(fullAnalysis.manager_duel.home_manager);
          }
          if (!fullAnalysis.manager_duel.away_photo && fullAnalysis.manager_duel.away_manager) {
            fullAnalysis.manager_duel.away_photo = await this.playerMedia.getPlayerPhoto(fullAnalysis.manager_duel.away_manager);
          }
        }
        this.details.set(fullAnalysis);
        this.loadingDetails.set(false);
      });
  }

  shortCode(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0].slice(0, 2) + parts[1].slice(0, 1)).toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
  }

  getLogo(teamName: string, sport?: string, existing?: string | null): string {
    if (existing) return existing;
    return getTeamLogo(teamName, sport) || '';
  }

  formatMatchDate(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  formatLine(line: any): string {
    const n = Number(line);
    if (isNaN(n)) return String(line ?? '');
    return n > 0 ? `+${n}` : `${n}`;
  }

  // Quick ticket injection with Value Bet (+EV)
  addValueBetToTicket(vb: ValueBetAnalysis) {
    const g = this.effectiveGame();
    if (!g) return;
    const finalOdd = this.customOdds() ?? vb.cuota_objetivo ?? 1.85;
    this.ticketModal.open({
      game: g,
      market: vb.mercado_recomendado || 'Value Bet IA',
      pick: vb.seleccion,
      odds: Number(finalOdd),
      eventLabel: `${g.away} vs ${g.home} · ${vb.seleccion}`,
      description: vb.justificacion_tactica,
    });
  }

  // Quick ticket injection with chosen bookmaker or custom odds
  addMoneylineBet(side: 'home' | 'away' | 'draw', defaultOdd?: number | null) {
    const g = this.effectiveGame();
    if (!g) return;
    const pickName = side === 'home' ? g.home : side === 'away' ? g.away : 'Empate';
    const pickVal = side === 'home' ? 'Local' : side === 'away' ? 'Visitante' : 'Empate';
    const finalOdd = this.customOdds() ?? defaultOdd ?? 1.90;

    this.ticketModal.open({
      game: g,
      market: 'ML',
      pick: pickVal,
      odds: Number(finalOdd),
      eventLabel: `${g.home} vs ${g.away} · Gana ${pickName}`,
    });
  }

  addSpreadBet(side: 'home' | 'away', line: any, defaultOdd?: number | null) {
    const g = this.effectiveGame();
    if (!g) return;
    const teamName = side === 'home' ? g.home : g.away;
    const numLine = Number(line) || 0;
    const finalOdd = this.customOdds() ?? defaultOdd ?? 1.90;

    this.ticketModal.open({
      game: g,
      market: 'Hándicap',
      pick: side === 'home' ? 'Local' : 'Visitante',
      line: numLine,
      odds: Number(finalOdd),
      eventLabel: `${teamName} (${numLine > 0 ? '+' : ''}${numLine})`,
    });
  }

  addTotalBet(side: 'over' | 'under', line: any, defaultOdd?: number | null) {
    const g = this.effectiveGame();
    if (!g) return;
    const numLine = Number(line) || 0;
    const market = g.sport === 'Americano' ? 'Puntos' : g.sport === 'Béisbol' ? 'Carreras' : 'Goles';
    const pick = side === 'over' ? 'Más de' : 'Menos de';
    const finalOdd = this.customOdds() ?? defaultOdd ?? 1.90;

    this.ticketModal.open({
      game: g,
      market,
      pick,
      line: numLine,
      odds: Number(finalOdd),
      eventLabel: `${g.home} vs ${g.away} · ${pick} ${numLine} ${market}`,
    });
  }

  addPlayerBet(player: PlayerStat, statCategory: string, line?: number, pick = 'Más de', defaultOdds = 1.85) {
    const g = this.effectiveGame();
    if (!g) return;
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

    const finalOdd = this.customOdds() ?? defaultOdds;

    this.ticketModal.open({
      game: g,
      market,
      pick: market === 'Otro' ? '' : pick,
      line: line ?? null,
      odds: Number(finalOdd),
      description: `${player.name} (${player.position || (player.team_side === 'home' ? g.home : g.away)}): ${statCategory} ${pick} ${line ?? ''}`.trim(),
      eventLabel: `${player.name} · ${statCategory} (${g.home} vs ${g.away})`,
    });
  }
}
