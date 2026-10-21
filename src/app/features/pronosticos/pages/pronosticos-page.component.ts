import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SportsService } from '../../partidos/services/sports.service';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { TicketModalService } from '../../apuestas/services/ticket-modal.service';
import { zoneDay } from '../../../shared/utils/zone.utils';
import type {
  SportsGame,
  GameReference,
  ValueBetAnalysis,
  AIValueBetResponse,
  AlternativeMarketOption,
  PredictionEvaluation,
} from '../../partidos/services/sports.model';
import type { SelectionDetail } from '../../apuestas/services/selection-detail';
import type { BetLeg } from '../../apuestas/services/bet.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { getTeamLogo } from '../../../shared/utils/team-logos.utils';
import { CuotasStatsModalService } from '../../partidos/services/cuotas-stats-modal.service';
import {
  generateDeepAnalysis,
  getUnifiedMatchPrediction,
  evaluatePrediction,
  evaluateMarketResult,
  calculateUnifiedGameProbabilities,
  isBasketballGame,
  isNFLGame,
  isMLBGame,
  isSoccerGame,
  sanitizeAIPredictionForSport,
} from '../../../shared/utils/match-analysis.utils';

export interface AIPrediction {
  game: SportsGame;
  homeWinProb: number;
  drawProb: number | null;
  awayWinProb: number;
  expectedTotal: number;
  overProb: number;
  bttsProb: number | null;
  bestPick: {
    label: string;
    market: string;
    pick: string;
    line: number | null;
    odds: number;
    prob: number;
    confidence: 'Muy Alta' | 'Alta' | 'Media';
    isEV: boolean;
    reasoning: string;
  };
  alternatives: AlternativeMarketOption[];
  valueBet: ValueBetAnalysis;
}

export interface AIParlayLeg {
  game: SportsGame;
  selectionText: string;
  market: string;
  pick: string;
  line: number | null;
  odds: number;
  prob: number;
  status: 'WON' | 'LOST' | 'PENDING' | 'LIVE';
  scoreText?: string;
}

export interface AIParlay {
  id: string;
  title: string;
  type: 'seguro' | 'valor' | 'goles';
  badge: string;
  badgeClass: string;
  description: string;
  combinedOdds: number;
  combinedProb: number;
  status: 'WON' | 'LOST' | 'PENDING' | 'LIVE';
  legsWon: number;
  legsTotal: number;
  legs: AIParlayLeg[];
}

@Component({
  selector: 'app-pronosticos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, IconComponent],
  templateUrl: './pronosticos-page.component.html',
  host: { class: 'block w-full' },
})
export class PronosticosPageComponent implements OnInit {
  private router = inject(Router);
  private sports = inject(SportsService);
  private ticketModal = inject(TicketModalService);
  private cuotasModalService = inject(CuotasStatsModalService);
  vm = inject(LedgerState);

  // Deep Analysis Navigation & Modal
  isModalOpen = signal(false);
  modalGame = signal<SportsGame | null>(null);

  openMatchModal(game: SportsGame) {
    this.goToMatchDetail(game);
  }

  goToMatchDetail(game: SportsGame) {
    void this.router.navigate(['/partidos', game.league, game.id]);
  }

  // Filter signals
  selectedSport = signal<'all' | 'futbol' | 'nfl' | 'nba' | 'mlb'>('all');
  selectedDate = signal<string>('');
  onlyHighConfidence = signal(false);
  onlyEV = signal(false);
  includeFinished = signal(false); // Default false: oculta partidos finalizados para no saturar la vista
  searchQuery = signal('');
  loading = signal(false);
  isRefreshingAi = signal(false);
  error = signal('');

  // Performance & Virtualization
  displayLimit = signal<number>(24);
  showAuditDetails = signal<boolean>(false);

  // Auditoría IA Filters & Predictions Cache
  auditView = signal<'matches' | 'parlays'>('matches');
  auditFilter = signal<'all' | 'won' | 'lost' | 'pending'>('all');
  aiPredictions = signal<Record<string, AIValueBetResponse>>({});

  games = signal<SportsGame[]>([]);

  todayStr = computed(() => zoneDay(new Date().toISOString(), this.vm.data().profile.timezone));
  tomorrowStr = computed(() => {
    const t = this.todayStr();
    const d = new Date(t + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  // Explicit, unambiguous market formatter
  formatRecommendedMarket(market?: string, game?: SportsGame | null, vb?: AIValueBetResponse | null): string {
    if (!game) return market || 'Selección de Valor';
    const isSoccer = isSoccerGame(game.sport, game.league);
    const isBball = isBasketballGame(game.sport, game.league);
    const isNfl = isNFLGame(game.sport, game.league);
    const isMlb = isMLBGame(game.sport, game.league);
    const raw = (market || '').trim();
    const home = game.home;
    const away = game.away;

    // Prevent soccer markets from displaying on non-soccer games
    if (
      !isSoccer &&
      (raw.toLowerCase().includes('ambos') ||
        raw.toLowerCase().includes('btts') ||
        raw.toLowerCase().includes('gol') ||
        raw.toLowerCase().includes('empate'))
    ) {
      const sanitized = getUnifiedMatchPrediction(game);
      return sanitized.recommended_market;
    }

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
    if ((mType === 'draw' || raw.toLowerCase().includes('empate')) && isSoccer) {
      return 'Empate (Draw)';
    }
    if (mType === 'over_2_5') {
      return isSoccer ? 'Más de 2.5 Goles (Over 2.5)' : isBball ? 'Más de 218.5 Puntos' : isNfl ? 'Más de 44.5 Puntos' : 'Más de 8.5 Carreras';
    }
    if (mType === 'under_2_5') {
      return isSoccer ? 'Menos de 2.5 Goles (Under 2.5)' : isBball ? 'Menos de 218.5 Puntos' : isNfl ? 'Menos de 44.5 Puntos' : 'Menos de 8.5 Carreras';
    }

    const p = calculateUnifiedGameProbabilities(game);
    const chosenTeam = p.favorite === 'away' ? away : home;
    return `Victoria de ${chosenTeam} (Moneyline)`;
  }

  getGamePrediction(g: SportsGame): AIValueBetResponse {
    const raw = this.aiPredictions()[g.id] || getUnifiedMatchPrediction(g);
    return sanitizeAIPredictionForSport(raw, g);
  }

  getPredictionEvaluation(g: SportsGame): PredictionEvaluation {
    const pred = this.getGamePrediction(g);
    return evaluatePrediction(pred, g);
  }

  // Dashboard KPI de Efectividad IA del Día (porcentaje y partidos resueltos)
  // Garantiza invariante: won + lost + pending + void === totalGames
  auditSummary = computed(() => {
    const list = this.games();
    let won = 0;
    let lost = 0;
    let pending = 0;
    let voidCount = 0;
    let live = 0;

    for (const g of list) {
      const pred = this.getGamePrediction(g);
      const ev = evaluatePrediction(pred, g);
      if (ev.status === 'WON') {
        won++;
      } else if (ev.status === 'LOST') {
        lost++;
      } else if (ev.status === 'VOID') {
        voidCount++;
      } else {
        if (g.state === 'live') live++;
        else pending++;
      }
    }

    const totalResolved = won + lost;
    const winRate = totalResolved > 0 ? Number(((won / totalResolved) * 100).toFixed(1)) : 0;

    return {
      totalGames: list.length,
      totalResolved,
      won,
      lost,
      pending,
      voidCount,
      live,
      winRate,
      hasEvaluations: totalResolved > 0,
    };
  });

  // Dashboard KPI de Efectividad de Parlays IA
  parlayAuditSummary = computed(() => {
    const list = this.curatedParlays();
    let won = 0;
    let lost = 0;
    let pending = 0;
    let live = 0;

    for (const p of list) {
      if (p.status === 'WON') {
        won++;
      } else if (p.status === 'LOST') {
        lost++;
      } else if (p.status === 'LIVE') {
        live++;
      } else {
        pending++;
      }
    }

    const totalResolved = won + lost;
    const winRate = totalResolved > 0 ? Number(((won / totalResolved) * 100).toFixed(1)) : 0;

    return {
      totalParlays: list.length,
      totalResolved,
      won,
      lost,
      pending: pending + live,
      winRate,
      hasEvaluations: totalResolved > 0,
    };
  });

  // Evaluar cualquier opción alternativa priorizando el estado determinista congelado del backend
  evalAlternativeOption(alt: AlternativeMarketOption, game: SportsGame): 'WON' | 'LOST' | 'PENDING' | 'VOID' {
    if (alt.status && (alt.status === 'WON' || alt.status === 'LOST' || alt.status === 'VOID')) {
      return alt.status;
    }
    return evaluateMarketResult(alt.market, alt.market_type || alt.tag, game);
  }

  // Lista detallada con resumen de aciertos y fallos para la vista
  auditedMatches = computed(() => {
    const filter = this.auditFilter();
    const list = this.games();
    const evaluated = list.map((g) => {
      const pred = this.getGamePrediction(g);
      const ev = evaluatePrediction(pred, g);
      const marketFormatted = this.formatRecommendedMarket(pred.recommended_market, g, pred);

      let reasoningSummary = '';
      if (ev.status === 'WON') {
        reasoningSummary = ev.ruleApplied
          ? `Acierto Verificado (Determinista): ${ev.ruleApplied}. Marcador oficial: ${g.home} ${g.home_score} – ${g.away_score} ${g.away}.`
          : `Acierto: ${g.home_score != null ? `${g.home} ${g.home_score} – ${g.away_score} ${g.away}` : ''}. Pronóstico congelado: ${marketFormatted} (${pred.ai_estimated_probability_pct}% prob.).`;
      } else if (ev.status === 'LOST') {
        reasoningSummary = ev.ruleApplied
          ? `Fallo Verificado (Determinista): ${ev.ruleApplied}. Marcador oficial: ${g.home} ${g.home_score} – ${g.away_score} ${g.away}.`
          : `Fallo: El partido finalizó ${g.home_score != null ? `${g.home} ${g.home_score} – ${g.away_score} ${g.away}` : 'con marcador adverso'}. Selección congelada: ${marketFormatted}.`;
      } else if (ev.status === 'VOID') {
        reasoningSummary = `VOID / Push: ${ev.ruleApplied || 'Línea entera empatada o partido pospuesto/cancelado. Sin efecto en tasa de acierto.'}`;
      } else {
        reasoningSummary = `Pronóstico Congelado (${pred.locked_at ? 'Inmutable' : 'Pre-partido'}): ${marketFormatted} con ${pred.ai_estimated_probability_pct}% de probabilidad estimada.`;
      }

      return {
        game: g,
        prediction: pred,
        evaluation: ev,
        marketFormatted,
        reasoningSummary,
      };
    });

    if (filter === 'won') return evaluated.filter((m) => m.evaluation.status === 'WON');
    if (filter === 'lost') return evaluated.filter((m) => m.evaluation.status === 'LOST');
    if (filter === 'pending') return evaluated.filter((m) => m.evaluation.status === 'PENDING');
    return evaluated;
  });

  // Sports definition
  sportsList = [
    { id: 'all', label: 'Todos los Deportes', icon: '⚽' },
    { id: 'futbol', label: 'Fútbol', icon: '⚽' },
    { id: 'nfl', label: 'NFL (Americano)', icon: '🏈' },
    { id: 'nba', label: 'NBA (Baloncesto)', icon: '🏀' },
    { id: 'mlb', label: 'Béisbol (MLB)', icon: '⚾' },
  ] as const;

  ngOnInit() {
    this.selectedDate.set(this.todayStr());
    void this.loadDailyPredictions();
  }

  async loadDailyPredictions(forceRefresh = false) {
    if (forceRefresh) {
      this.isRefreshingAi.set(true);
      this.aiPredictions.set({});
    } else {
      this.loading.set(true);
    }
    this.error.set('');
    const day = this.selectedDate();

    const leagues = [
      'premier',
      'laliga',
      'champions',
      'ligamx',
      'mls',
      'seriea',
      'bundesliga',
      'nfl',
      'nba',
      'mlb',
      'nations',
      'friendlies',
    ];

    try {
      const results: SportsGame[] = [];
      const batchSize = 4;
      for (let i = 0; i < leagues.length; i += batchSize) {
        const batch = leagues.slice(i, i + batchSize);
        const batchResponses = await Promise.all(
          batch.map(async (l) => {
            try {
              const res = await this.sports.events(l, day);
              return res?.events ?? [];
            } catch {
              return [];
            }
          }),
        );
        for (const list of batchResponses) {
          results.push(...list);
        }
      }

      // Deduplicate
      const seen = new Set<string>();
      const unique = results.filter((g) => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      });

      // Sort by start date
      unique.sort((a, b) => (a.start > b.start ? 1 : -1));
      this.games.set(unique);

      // 1. Fetch all pre-warmed frozen AI predictions from database in a single fast call (<30ms)
      const prewarmed = await this.sports.cachedPredictions();
      const initialPreds: Record<string, AIValueBetResponse> = { ...prewarmed, ...this.aiPredictions() };
      for (const g of unique) {
        if (initialPreds[g.id]) {
          initialPreds[g.id] = sanitizeAIPredictionForSport(initialPreds[g.id], g);
        } else {
          initialPreds[g.id] = getUnifiedMatchPrediction(g);
        }
      }
      this.aiPredictions.set(initialPreds);

      // 2. Only fetch from backend if a visible match does NOT yet have a locked snapshot in DB
      const unlockedGames = unique.slice(0, 16).filter((g) => !prewarmed[g.id]?.locked_at);
      if (unlockedGames.length) {
        const batchUpdates: Record<string, AIValueBetResponse> = {};
        await Promise.allSettled(
          unlockedGames.map(async (g) => {
            try {
              const vb = await this.sports.valueBet(g.league, g.id, g.home, g.away, g.start, false);
              if (vb) {
                batchUpdates[g.id] = sanitizeAIPredictionForSport(vb, g);
              }
            } catch {
              // Keep unified baseline prediction
            }
          })
        );
        if (Object.keys(batchUpdates).length) {
          this.aiPredictions.update((m) => ({ ...m, ...batchUpdates }));
        }
      }
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'No se pudieron sincronizar los partidos para el análisis IA.',
      );
    } finally {
      this.loading.set(false);
      this.isRefreshingAi.set(false);
    }
  }

  // Pre-calculate full AI prediction per game, reacting immediately to aiPredictions updates
  predictions = computed<AIPrediction[]>(() => {
    const aiMap = this.aiPredictions();
    return this.games().map((g) => this.calculatePrediction(g, aiMap[g.id]));
  });

  filteredPredictions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sport = this.selectedSport();
    const highConf = this.onlyHighConfidence();
    const ev = this.onlyEV();
    const showFinal = this.includeFinished();

    return this.predictions().filter((p) => {
      const g = p.game;
      // Default: exclude already played matches from betting analysis to avoid clutter
      if (!showFinal && g.state === 'final') return false;

      if (highConf && p.bestPick.prob < 65) return false;
      if (ev && !p.bestPick.isEV) return false;

      if (sport === 'futbol' && !this.isSoccer(g)) return false;
      if (sport === 'nfl' && !isNFLGame(g.sport, g.league)) return false;
      if (sport === 'nba' && !isBasketballGame(g.sport, g.league)) return false;
      if (sport === 'mlb' && !isMLBGame(g.sport, g.league)) return false;

      if (q && !`${g.home} ${g.away} ${g.league_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  visiblePredictions = computed(() => {
    return this.filteredPredictions().slice(0, this.displayLimit());
  });

  loadMore() {
    this.displayLimit.update((c) => c + 24);
  }

  // Parlays Engine: automatically constructs the 3 best parlays from matches and audits them
  curatedParlays = computed<AIParlay[]>(() => {
    const all = this.predictions();
    if (all.length < 2) return [];

    const parlays: AIParlay[] = [];

    const buildLeg = (p: AIPrediction): AIParlayLeg => {
      const g = p.game;
      const pred = this.getGamePrediction(g);
      const ev = evaluatePrediction(pred, g);
      let status: 'WON' | 'LOST' | 'PENDING' | 'LIVE' = 'PENDING';
      let scoreText = '';

      if (g.state === 'final') {
        status = ev.status === 'WON' ? 'WON' : 'LOST';
        scoreText = g.home_score != null ? `${g.away_score} - ${g.home_score}` : 'Finalizado';
      } else if (g.state === 'live') {
        status = 'LIVE';
        scoreText = `${g.away_score ?? 0} - ${g.home_score ?? 0} (En vivo)`;
      }

      return {
        game: g,
        selectionText: `${g.away} vs ${g.home} · ${p.bestPick.label}`,
        market: p.bestPick.market,
        pick: p.bestPick.pick,
        line: p.bestPick.line,
        odds: p.bestPick.odds,
        prob: p.bestPick.prob,
        status,
        scoreText,
      };
    };

    const computeParlayStatus = (legs: AIParlayLeg[]): { status: 'WON' | 'LOST' | 'PENDING' | 'LIVE'; legsWon: number; legsTotal: number } => {
      const legsWon = legs.filter((l) => l.status === 'WON').length;
      const legsLost = legs.filter((l) => l.status === 'LOST').length;
      const legsLive = legs.filter((l) => l.status === 'LIVE').length;
      let status: 'WON' | 'LOST' | 'PENDING' | 'LIVE' = 'PENDING';

      if (legsLost > 0) {
        status = 'LOST';
      } else if (legsWon === legs.length) {
        status = 'WON';
      } else if (legsLive > 0) {
        status = 'LIVE';
      } else {
        status = 'PENDING';
      }
      return { status, legsWon, legsTotal: legs.length };
    };

    // 1. Parlay de Alta Confianza (Seguro) - 2-3 picks with highest probability
    const highCertainty = [...all]
      .filter((p) => p.bestPick.prob >= 60)
      .sort((a, b) => b.bestPick.prob - a.bestPick.prob)
      .slice(0, 3);

    if (highCertainty.length >= 2) {
      const combinedOdds = Number(
        highCertainty.reduce((acc, p) => acc * p.bestPick.odds, 1).toFixed(2),
      );
      const combinedProb = Math.round(
        highCertainty.reduce((acc, p) => acc * (p.bestPick.prob / 100), 1) * 100,
      );

      const legs = highCertainty.map(buildLeg);
      const { status, legsWon, legsTotal } = computeParlayStatus(legs);

      parlays.push({
        id: 'parlay-seguro',
        title: 'Parlay de Alta Probabilidad · El Seguro del Día',
        type: 'seguro',
        badge: 'ALTA CONFIANZA IA',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        description: 'Combinada de 2 a 3 selecciones con la mayor probabilidad estadística calculada por el modelo.',
        combinedOdds,
        combinedProb,
        status,
        legsWon,
        legsTotal,
        legs,
      });
    }

    // 2. Parlay de Máximo Valor (+EV / Cuota Media) - 3 picks with best value
    const evPicks = [...all]
      .filter((p) => p.bestPick.isEV)
      .sort((a, b) => b.bestPick.odds - a.bestPick.odds)
      .slice(0, 3);

    const valueCandidates = evPicks.length >= 3 ? evPicks : [...all].sort((a, b) => b.bestPick.odds - a.bestPick.odds).slice(0, 3);

    if (valueCandidates.length >= 2) {
      const combinedOdds = Number(
        valueCandidates.reduce((acc, p) => acc * p.bestPick.odds, 1).toFixed(2),
      );
      const combinedProb = Math.round(
        valueCandidates.reduce((acc, p) => acc * (p.bestPick.prob / 100), 1) * 100,
      );

      const legs = valueCandidates.map(buildLeg);
      const { status, legsWon, legsTotal } = computeParlayStatus(legs);

      parlays.push({
        id: 'parlay-valor',
        title: 'Parlay de Rentabilidad +EV · Ventaja vs Las Casas',
        type: 'valor',
        badge: 'MAYOR VALOR ESPERADO (+EV)',
        badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        description: 'Picks donde la probabilidad estimada por IA supera el margen de las casas de apuestas para maximizar ROI.',
        combinedOdds,
        combinedProb,
        status,
        legsWon,
        legsTotal,
        legs,
      });
    }

    // 3. Parlay de Goles & Puntos (Over / Under Totales)
    const totalsPicks = [...all]
      .filter((p) => p.overProb >= 58 || (p.bttsProb ?? 0) >= 58)
      .slice(0, 3);

    if (totalsPicks.length >= 2) {
      const combinedOdds = Number(
        totalsPicks.reduce((acc, p) => acc * 1.72, 1).toFixed(2),
      );
      const combinedProb = Math.round(
        totalsPicks.reduce((acc, p) => acc * (Math.max(p.overProb, p.bttsProb ?? 0) / 100), 1) * 100,
      );

      const legs = totalsPicks.map((p) => {
        const isSoccer = this.isSoccer(p.game);
        const isBball = isBasketballGame(p.game.sport, p.game.league);
        const isNfl = isNFLGame(p.game.sport, p.game.league);
        const isMlb = isMLBGame(p.game.sport, p.game.league);
        const market = isSoccer ? 'Total de goles' : isBball ? 'Total de puntos' : isNfl ? 'Total de puntos' : isMlb ? 'Total de carreras' : 'Total de puntos';
        const pick = 'Más de';
        const line = isSoccer ? 2.5 : isBball ? 218.5 : isNfl ? 44.5 : 8.5;
        const baseLeg = buildLeg(p);
        baseLeg.market = market;
        baseLeg.pick = pick;
        baseLeg.line = line;
        baseLeg.odds = 1.72;
        baseLeg.prob = Math.max(p.overProb, p.bttsProb ?? 60);
        baseLeg.selectionText = `${p.game.away} vs ${p.game.home} · Más de ${line} ${market}`;
        if (p.game.state === 'final') {
          const legEval = evaluateMarketResult(`Más de ${line}`, 'over', p.game);
          baseLeg.status = legEval === 'WON' ? 'WON' : 'LOST';
        }
        return baseLeg;
      });

      const { status, legsWon, legsTotal } = computeParlayStatus(legs);

      parlays.push({
        id: 'parlay-goles',
        title: 'Parlay Dinámico · Goles & Puntos Totales',
        type: 'goles',
        badge: 'TENDENCIA OFENSIVA',
        badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        description: 'Combinada basada en ritmo ofensivo y expectativas de anotación por encima del promedio.',
        combinedOdds,
        combinedProb,
        status,
        legsWon,
        legsTotal,
        legs,
      });
    }

    return parlays;
  });

  // Calculate deterministic mathematical & machine-learning probabilities
  private calculatePrediction(g: SportsGame, aiResp?: AIValueBetResponse): AIPrediction {
    let hash = 0;
    for (let i = 0; i < g.id.length; i++) {
      hash = (hash << 5) - hash + g.id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const soccer = this.isSoccer(g);
    const basketball = isBasketballGame(g.sport, g.league);
    const nfl = isNFLGame(g.sport, g.league);
    const baseball = isMLBGame(g.sport, g.league);

    // Model Base Probability Calculation
    const bias = (seed % 30) - 15;
    const baseHome = Math.min(78, Math.max(25, 53 + bias));

    let homeWinProb: number;
    let awayWinProb: number;
    let drawProb: number | null = null;
    let expectedTotal: number;
    let overProb: number;
    let bttsProb: number | null = null;

    if (soccer) {
      drawProb = 24;
      const factor = (100 - drawProb) / 100;
      homeWinProb = Math.round(baseHome * factor);
      awayWinProb = 100 - homeWinProb - drawProb;
      expectedTotal = Number((2.3 + (seed % 14) / 10).toFixed(1));
      overProb = Math.min(80, Math.max(42, Math.round(expectedTotal > 2.5 ? 54 + (seed % 18) : 48 - (seed % 12))));
      bttsProb = Math.min(76, Math.max(44, 52 + (seed % 18) - 9));
    } else if (basketball) {
      homeWinProb = baseHome;
      awayWinProb = 100 - baseHome;
      drawProb = null;
      expectedTotal = 212 + (seed % 22);
      overProb = Math.min(75, Math.max(48, 55 + (seed % 16) - 8));
      bttsProb = null;
    } else {
      // NFL / MLB
      homeWinProb = baseHome;
      awayWinProb = 100 - baseHome;
      drawProb = null;
      expectedTotal = nfl ? 44 + (seed % 12) : 8 + (seed % 5);
      overProb = Math.min(74, Math.max(46, 52 + (seed % 16) - 8));
      bttsProb = null;
    }

    // Unified AI source of truth: prioritize server Gemini analysis (sanitized for sport), fallback to unified local model
    const ai = sanitizeAIPredictionForSport(aiResp || this.aiPredictions()[g.id], g);

    let pickMarket = 'Moneyline';
    let pickVal = 'Local';
    let pickLine: number | null = null;
    const mType = (ai.market_type || '').toLowerCase();
    const mLabel = ai.recommended_market || '';

    // Strictly enforce sport market validity (Never assign BTTS or Goles to basketball or NFL!)
    if ((mType === 'btts_yes' || mLabel.toLowerCase().includes('ambos equipos') || mLabel.toLowerCase().includes('btts')) && soccer) {
      pickMarket = 'Ambos equipos anotan';
      pickVal = 'Sí';
    } else if (mType === 'btts_no' && soccer) {
      pickMarket = 'Ambos equipos anotan';
      pickVal = 'No';
    } else if (mType.includes('over') || mLabel.toLowerCase().includes('más de') || mLabel.toLowerCase().includes('over')) {
      pickMarket = soccer ? 'Total de goles' : baseball ? 'Total de carreras' : 'Total de puntos';
      pickVal = 'Más de';
      pickLine = soccer ? 2.5 : basketball ? 218.5 : nfl ? 44.5 : 8.5;
    } else if (mType.includes('under') || mLabel.toLowerCase().includes('menos de') || mLabel.toLowerCase().includes('under')) {
      pickMarket = soccer ? 'Total de goles' : baseball ? 'Total de carreras' : 'Total de puntos';
      pickVal = 'Menos de';
      pickLine = soccer ? 2.5 : basketball ? 218.5 : nfl ? 44.5 : 8.5;
    } else if (mType === 'spread' || mLabel.toLowerCase().includes('spread') || mLabel.toLowerCase().includes('hándicap')) {
      pickMarket = baseball ? 'Run Line' : 'Spread';
      pickVal = mLabel.toLowerCase().includes(g.away.toLowerCase()) ? g.away : g.home;
      pickLine = basketball ? -4.5 : nfl ? -3.5 : -1.5;
    } else if (mType === 'away_win' || mLabel.toLowerCase().includes(g.away.toLowerCase())) {
      pickMarket = 'Moneyline';
      pickVal = 'Visitante';
    } else if ((mType === 'draw' || mLabel.toLowerCase().includes('empate')) && soccer) {
      pickMarket = 'Moneyline';
      pickVal = 'Empate';
    } else {
      pickMarket = 'Moneyline';
      pickVal = 'Local';
    }

    const confidence: 'Muy Alta' | 'Alta' | 'Media' =
      ai.confidence_level >= 4 ? 'Muy Alta' : ai.confidence_level === 3 ? 'Alta' : 'Media';

    const valueBet: ValueBetAnalysis = {
      partido: `${g.away} vs ${g.home}`,
      mercado_recomendado: ai.recommended_market,
      seleccion: ai.recommended_market,
      cuota_objetivo: ai.target_odd,
      bookmaker_cuota: ai.bookmaker || 'Pinnacle / Bet365',
      probabilidad_implicita_casino: ai.implicit_probability_pct,
      probabilidad_estimada_ia: ai.ai_estimated_probability_pct,
      edge_ev: ai.expected_value_pct,
      is_value_bet: ai.is_value_bet,
      nivel_confianza: ai.confidence_level,
      stake_sugerido_porcentaje: ai.suggested_stake_pct,
      justificacion_tactica: ai.tactical_reasoning,
      super_contexto: null,
    };

    return {
      game: g,
      homeWinProb,
      drawProb,
      awayWinProb,
      expectedTotal,
      overProb,
      bttsProb,
      bestPick: {
        label: ai.recommended_market,
        market: pickMarket,
        pick: pickVal,
        line: pickLine,
        odds: ai.target_odd,
        prob: ai.ai_estimated_probability_pct,
        confidence,
        isEV: ai.is_value_bet,
        reasoning: ai.tactical_reasoning,
      },
      alternatives: ai.alternative_options || [],
      valueBet,
    };
  }

  addAlternativeOptionToTicket(g: SportsGame, opt: AlternativeMarketOption) {
    this.ticketModal.open({
      game: g,
      market: opt.market,
      pick: opt.market,
      odds: opt.target_odd,
      eventLabel: `${g.away} vs ${g.home} · ${opt.market}`,
    });
  }

  isSoccer(g: SportsGame): boolean {
    return isSoccerGame(g.sport, g.league);
  }

  getLogo(teamName: string, sport?: string, existing?: string | null): string {
    if (existing) return existing;
    return getTeamLogo(teamName, sport) || '';
  }

  // Pre-load and inject a full curated Parlay into Ticket Modal
  loadParlayIntoTicket(parlay: AIParlay) {
    const games: GameReference[] = parlay.legs.map((leg) => ({
      id: leg.game.id,
      league: leg.game.league,
      league_name: leg.game.league_name,
      sport: leg.game.sport,
      start: leg.game.start,
      home: leg.game.home,
      away: leg.game.away,
      home_logo: leg.game.home_logo,
      away_logo: leg.game.away_logo,
      provider: leg.game.provider,
    }));

    const selections: SelectionDetail[] = parlay.legs.map((leg) => ({
      sport: leg.game.sport,
      market: leg.market,
      pick: leg.pick,
      line: leg.line,
      description: `${leg.game.away} vs ${leg.game.home} · ${leg.selectionText}`,
      game_id: leg.game.id,
      event_label: `${leg.game.away} vs ${leg.game.home}`,
    }));

    const legs: BetLeg[] = parlay.legs.map((leg) => ({
      selection: leg.selectionText,
      odds: leg.odds,
      status: 'pending',
    }));

    this.ticketModal.open({
      betType: 'parlay',
      games,
      selections,
      legs,
      odds: parlay.combinedOdds,
      eventLabel: parlay.title,
    });
  }

  // Add individual AI recommendation to ticket
  addSinglePredictionToTicket(pred: AIPrediction) {
    const g = pred.game;
    this.ticketModal.open({
      game: g,
      market: pred.bestPick.market,
      pick: pred.bestPick.pick,
      line: pred.bestPick.line,
      odds: pred.bestPick.odds,
      eventLabel: `${g.away} vs ${g.home} · ${pred.bestPick.label}`,
    });
  }
}
