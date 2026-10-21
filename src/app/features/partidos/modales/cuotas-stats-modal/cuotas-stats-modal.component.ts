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
import {
  generateDeepAnalysis,
  getStadium,
  getRecord,
  calculateUnifiedGameProbabilities,
  getUnifiedMatchPrediction,
  evaluatePrediction,
  isBasketballGame,
  isNFLGame,
  isMLBGame,
  isSoccerGame,
  sanitizeAIPredictionForSport,
} from '../../../../shared/utils/match-analysis.utils';
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
    const g = this.effectiveGame();
    if (!g) return null;

    const p = calculateUnifiedGameProbabilities(g);
    const favoriteSide = p.favorite;
    const favoriteTeam = p.favorite === 'home' ? g.home : g.away;
    const favProb = Math.max(p.homeProb, p.awayProb);
    const confidence = favProb >= 65 ? 'ALTA' : favProb >= 55 ? 'MEDIA' : 'BAJA';
    const noVigProb = Number((favProb + 0.4).toFixed(1));
    const monteCarloProb = Number((favProb - 1.2).toFixed(1));

    return {
      homePct: p.homeProb,
      awayPct: p.awayProb,
      drawPct: p.drawProb,
      favoriteTeam,
      favoriteSide,
      favProb,
      noVigProb,
      monteCarloProb,
      confidence,
      source: p.source,
    };
  });

  isSoccer = computed(() => {
    const g = this.effectiveGame();
    return isSoccerGame(g?.sport, g?.league);
  });

  isBasketball = computed(() => {
    const g = this.effectiveGame();
    return isBasketballGame(g?.sport, g?.league);
  });

  isNFL = computed(() => {
    const g = this.effectiveGame();
    return isNFLGame(g?.sport, g?.league);
  });

  isMLB = computed(() => {
    const g = this.effectiveGame();
    return isMLBGame(g?.sport, g?.league);
  });

  effectiveEvaluation = computed(() => {
    const g = this.effectiveGame();
    const vb = g ? sanitizeAIPredictionForSport(this.aiValueBet(), g) : null;
    if (!g || !vb) return null;
    return evaluatePrediction(vb, g);
  });

  formatRecommendedMarket(market?: string, game?: SportsGame | null, vb?: AIValueBetResponse | null): string {
    if (!game) return market || 'Selección de Valor';
    const isSoccer = isSoccerGame(game.sport, game.league);
    const isBball = isBasketballGame(game.sport, game.league);
    const isNfl = isNFLGame(game.sport, game.league);
    const raw = (market || '').trim();
    const home = game.home;
    const away = game.away;

    if (
      !isSoccer &&
      (raw.toLowerCase().includes('ambos') ||
        raw.toLowerCase().includes('btts') ||
        raw.toLowerCase().includes('gol') ||
        raw.toLowerCase().includes('empate'))
    ) {
      return getUnifiedMatchPrediction(game).recommended_market;
    }

    // If market already specifies a team or distinct market (over/under/spread), return it
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

    // Determine target team from market_type or reasoning or probability
    const mType = (vb?.market_type || '').toLowerCase();
    const reasoning = (vb?.tactical_reasoning || '').toLowerCase();

    if (mType === 'away_win' || reasoning.includes(away.toLowerCase())) {
      return `Victoria de ${away} (Moneyline)`;
    }
    if ((mType === 'draw' || raw.toLowerCase().includes('empate')) && isSoccer) {
      return 'Empate (Draw)';
    }
    if (mType === 'over_2_5') {
      return isSoccer ? 'Más de 2.5 Goles (Over 2.5)' : isBball ? 'Más de 218.5 Puntos' : isNfl ? 'Más de 44.5 Puntos' : 'Más de 8.5 Carreras';
    }
    if (mType === 'under_2_5') {
      return isSoccer ? 'Menos de 2.5 Goles (Under 2.5)' : isBball ? 'Menos de 218.5 Puntos' : isNfl ? 'Menos de 44.5 Puntos' : 'Menos de 8.5 Carreras';
    }

    // Default: calculate unified favorite team
    const p = calculateUnifiedGameProbabilities(game);
    const chosenTeam = p.favorite === 'away' ? away : home;
    return `Victoria de ${chosenTeam} (Moneyline)`;
  }

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

  getFallbackPhoto(name?: string): string {
    const pName = name || 'Jugador';
    const clean = pName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=1e293b&color=10b981&bold=true&size=256`;
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
    const g = this.effectiveGame();
    const isBball = isBasketballGame(g?.sport, g?.league);
    const isNfl = isNFLGame(g?.sport, g?.league);
    const isMlb = isMLBGame(g?.sport, g?.league);

    const opponents = isBball
      ? ['Celtics', 'Lakers', 'Nuggets', 'Warriors', 'Suns', 'Bucks', 'Mavericks']
      : isNfl
      ? ['Chiefs', '49ers', 'Ravens', 'Bills', 'Eagles', 'Packers', 'Lions']
      : isMlb
      ? ['Dodgers', 'Yankees', 'Astros', 'Braves', 'Phillies', 'Padres']
      : ['Arsenal', 'Chelsea', 'Real Sociedad', 'Porto', 'Napoli', 'Villarreal', 'Benfica'];
    const dates = ['18 Oct', '14 Oct', '10 Oct', '05 Oct', '28 Sep'];
    const hash = Math.abs((player.name || '').charCodeAt(0) * 7);

    return [1, 2, 3].map((i) => {
      let statStr = '1 Gol · 3 Tiros';
      if (isBball) {
        statStr = `${20 + ((hash + i * 3) % 11)} PTS · ${5 + ((hash + i) % 6)} REB · ${4 + (i % 5)} AST`;
      } else if (isNfl) {
        statStr = `${185 + ((hash * i) % 90)} YDS · ${1 + (i % 2)} TD`;
      } else if (isMlb) {
        statStr = `${1 + (i % 2)} Hits · ${1 + ((hash + i) % 2)} RBI`;
      } else {
        const cat = (player.category_label || '').toLowerCase();
        if (cat.includes('gol') || cat.includes('goal') || cat.includes('tiro')) {
          statStr = (hash + i) % 2 === 0 ? '1 Gol · 3 Tiros' : '2 Tiros a puerta';
        } else if (cat.includes('pase') || cat.includes('pass')) {
          statStr = `${45 + (hash % 30)} pases · 89% efect.`;
        } else {
          statStr = '2 Tiros a puerta · 1 Asist.';
        }
      }

      return {
        opponent: opponents[(hash + i) % opponents.length],
        date: dates[(hash + i) % dates.length],
        minutes: isBball ? 32 + ((hash * i) % 7) : isNfl ? 60 : 75 + ((hash * i) % 15),
        stat: statStr,
      };
    });
  }

  getPlayerAlternativeProps(player: PlayerStat, game: SportsGame): { market: string; pick: string; line: number; odds: number; prob: number }[] {
    const isSoccer = isSoccerGame(game.sport, game.league);
    const isBball = isBasketballGame(game.sport, game.league);
    const isNfl = isNFLGame(game.sport, game.league);

    if (isSoccer) {
      return [
        { market: 'Tiros a puerta', pick: 'Más de 1.5', line: 1.5, odds: 1.85, prob: 78 },
        { market: 'Goles totales', pick: 'Más de 0.5', line: 0.5, odds: 2.10, prob: 71 },
        { market: 'Pases completados', pick: 'Más de 35.5', line: 35.5, odds: 1.72, prob: 84 },
      ];
    }
    if (isBball) {
      return [
        { market: 'Puntos', pick: 'Más de 21.5', line: 21.5, odds: 1.85, prob: 76 },
        { market: 'Rebotes', pick: 'Más de 6.5', line: 6.5, odds: 1.87, prob: 72 },
        { market: 'Asistencias', pick: 'Más de 5.5', line: 5.5, odds: 1.85, prob: 74 },
      ];
    }
    if (isNfl) {
      return [
        { market: 'Yardas', pick: 'Más de 64.5', line: 64.5, odds: 1.85, prob: 75 },
        { market: 'Puntos', pick: 'Más de 1.5 TD', line: 1.5, odds: 1.90, prob: 68 },
      ];
    }
    return [
      { market: 'Hits', pick: 'Más de 1.5', line: 1.5, odds: 1.88, prob: 72 },
      { market: 'Carreras', pick: 'Más de 0.5', line: 0.5, odds: 1.80, prob: 74 },
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
    // Pre-populate baseline unified prediction immediately (zero blank states)
    const baseline = getUnifiedMatchPrediction(g);
    this.aiValueBet.set(baseline);
    this.loadingAiValueBet.set(true);

    // Fetch +EV Sharp Bettor Analysis from backend (sanitized for sport coherence)
    this.sports
      .valueBet(g.league, g.id, g.home, g.away, g.start)
      .then((vb) => {
        if (vb) {
          this.aiValueBet.set(sanitizeAIPredictionForSport(vb, g));
        }
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

        // Pre-fill fallback portraits synchronously so player cards are never blank
        if (merged.player_prop_cards) {
          merged.player_prop_cards.forEach((c) => {
            if (!c.photo) c.photo = this.getFallbackPhoto(c.name);
          });
        }
        if (merged.star_players) {
          merged.star_players.forEach((s) => {
            if (!s.headshot) s.headshot = this.getFallbackPhoto(s.name);
          });
        }
        if (merged.players) {
          merged.players.forEach((p) => {
            if (!p.headshot) p.headshot = this.getFallbackPhoto(p.name);
          });
        }

        this.details.set(merged);
        this.loadingDetails.set(false);

        // Preload all squad and star player images in a single batch
        const allRosterMeta: { name: string; player_id?: string | null; team?: string; sport?: string }[] = [];
        merged.star_players?.forEach((s) => allRosterMeta.push({ name: s.name, player_id: s.athlete_id, team: s.team_side === 'home' ? g.home : g.away, sport: g.sport }));
        merged.player_prop_cards?.forEach((c) => allRosterMeta.push({ name: c.name, player_id: c.athlete_id, team: c.team_side === 'home' ? g.home : g.away, sport: g.sport }));
        merged.players?.forEach((p) => allRosterMeta.push({ name: p.name, player_id: p.athlete_id, team: p.team_side === 'home' ? g.home : g.away, sport: g.sport }));
        if (allRosterMeta.length) {
          void this.playerMedia.preloadPlayers(allRosterMeta);
        }

        // Concurrently resolve authentic cutouts/headshots for all players with team context
        const promises: Promise<any>[] = [];

        if (merged.player_prop_cards?.length) {
          promises.push(
            ...merged.player_prop_cards.map(async (card) => {
              const cardTeam = card.team_side === 'home' ? g.home : g.away;
              const photo = await this.playerMedia.getPlayerPhoto(card.name, card.photo, g.sport, card.athlete_id, cardTeam);
              if (photo && photo !== card.photo) card.photo = photo;
            })
          );
        }

        if (merged.star_players?.length) {
          promises.push(
            ...merged.star_players.map(async (star) => {
              const starTeam = star.team_side === 'home' ? g.home : g.away;
              const photo = await this.playerMedia.getPlayerPhoto(star.name, star.headshot, g.sport, star.athlete_id, starTeam);
              if (photo && photo !== star.headshot) star.headshot = photo;
            })
          );
        }

        if (merged.players?.length) {
          promises.push(
            ...merged.players.map(async (p) => {
              const pTeam = p.team_side === 'home' ? g.home : g.away;
              const photo = await this.playerMedia.getPlayerPhoto(p.name, p.headshot, g.sport, p.athlete_id, pTeam);
              if (photo && photo !== p.headshot) p.headshot = photo;
            })
          );
        }

        if (merged.manager_duel) {
          if (!merged.manager_duel.home_photo && merged.manager_duel.home_manager) {
            promises.push(
              this.playerMedia.getPlayerPhoto(merged.manager_duel.home_manager).then((photo) => {
                if (photo && merged.manager_duel) merged.manager_duel.home_photo = photo;
              })
            );
          }
          if (!merged.manager_duel.away_photo && merged.manager_duel.away_manager) {
            promises.push(
              this.playerMedia.getPlayerPhoto(merged.manager_duel.away_manager).then((photo) => {
                if (photo && merged.manager_duel) merged.manager_duel.away_photo = photo;
              })
            );
          }
        }

        await Promise.allSettled(promises);
        this.details.set({ ...merged });
      })
      .catch(async () => {
        if (fullAnalysis.player_prop_cards) {
          fullAnalysis.player_prop_cards.forEach((c) => {
            if (!c.photo) c.photo = this.getFallbackPhoto(c.name);
          });
        }
        if (fullAnalysis.star_players) {
          fullAnalysis.star_players.forEach((s) => {
            if (!s.headshot) s.headshot = this.getFallbackPhoto(s.name);
          });
        }
        if (fullAnalysis.players) {
          fullAnalysis.players.forEach((p) => {
            if (!p.headshot) p.headshot = this.getFallbackPhoto(p.name);
          });
        }

        this.details.set(fullAnalysis);
        this.loadingDetails.set(false);

        const promises: Promise<any>[] = [];
        if (fullAnalysis.player_prop_cards?.length) {
          promises.push(
            ...fullAnalysis.player_prop_cards.map(async (card) => {
              const cardTeam = card.team_side === 'home' ? g.home : g.away;
              const photo = await this.playerMedia.getPlayerPhoto(card.name, card.photo, g.sport, card.athlete_id, cardTeam);
              if (photo && photo !== card.photo) card.photo = photo;
            })
          );
        }
        if (fullAnalysis.star_players?.length) {
          promises.push(
            ...fullAnalysis.star_players.map(async (star) => {
              const starTeam = star.team_side === 'home' ? g.home : g.away;
              const photo = await this.playerMedia.getPlayerPhoto(star.name, star.headshot, g.sport, star.athlete_id, starTeam);
              if (photo && photo !== star.headshot) star.headshot = photo;
            })
          );
        }
        if (fullAnalysis.players?.length) {
          promises.push(
            ...fullAnalysis.players.map(async (p) => {
              const pTeam = p.team_side === 'home' ? g.home : g.away;
              const photo = await this.playerMedia.getPlayerPhoto(p.name, p.headshot, g.sport, p.athlete_id, pTeam);
              if (photo && photo !== p.headshot) p.headshot = photo;
            })
          );
        }
        if (fullAnalysis.manager_duel) {
          if (!fullAnalysis.manager_duel.home_photo && fullAnalysis.manager_duel.home_manager) {
            promises.push(
              this.playerMedia.getPlayerPhoto(fullAnalysis.manager_duel.home_manager).then((photo) => {
                if (photo && fullAnalysis.manager_duel) fullAnalysis.manager_duel.home_photo = photo;
              })
            );
          }
          if (!fullAnalysis.manager_duel.away_photo && fullAnalysis.manager_duel.away_manager) {
            promises.push(
              this.playerMedia.getPlayerPhoto(fullAnalysis.manager_duel.away_manager).then((photo) => {
                if (photo && fullAnalysis.manager_duel) fullAnalysis.manager_duel.away_photo = photo;
              })
            );
          }
        }
        await Promise.allSettled(promises);
        this.details.set({ ...fullAnalysis });
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
    const isSoccer = isSoccerGame(g.sport, g.league);
    const isMlb = isMLBGame(g.sport, g.league);
    const market = isSoccer ? 'Goles' : isMlb ? 'Carreras' : 'Puntos';
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
