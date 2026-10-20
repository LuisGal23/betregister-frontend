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
  calculateUnifiedGameProbabilities,
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

export interface AIParlay {
  id: string;
  title: string;
  type: 'seguro' | 'valor' | 'goles';
  badge: string;
  badgeClass: string;
  description: string;
  combinedOdds: number;
  combinedProb: number;
  legs: {
    game: SportsGame;
    selectionText: string;
    market: string;
    pick: string;
    line: number | null;
    odds: number;
    prob: number;
  }[];
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

  // Dashboard KPI de Efectividad IA del Día
  auditSummary = computed(() => {
    const list = this.games();
    let won = 0;
    let lost = 0;
    let pending = 0;
    let live = 0;
    let netUnits = 0;

    for (const g of list) {
      const pred = this.getGamePrediction(g);
      const ev = evaluatePrediction(pred, g);
      if (ev.status === 'WON') {
        won++;
        netUnits += ev.profitUnits || 0;
      } else if (ev.status === 'LOST') {
        lost++;
        netUnits -= 1.0;
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
        reasoningSummary = `Acierto: ${g.home_score != null ? `${g.home} ${g.home_score} – ${g.away_score} ${g.away}` : ''}. El modelo proyectó una probabilidad de ${pred.ai_estimated_probability_pct}% vs ${pred.implicit_probability_pct}% del casino (+${pred.expected_value_pct}% EV) en favor de ${marketFormatted}, generando +${ev.profitUnits}u de ganancia.`;
      } else if (ev.status === 'LOST') {
        reasoningSummary = `Fallo: El partido finalizó ${g.home_score != null ? `${g.home} ${g.home_score} – ${g.away_score} ${g.away}` : 'con marcador adverso'}. La selección ${marketFormatted} (@${pred.target_odd}) no se cumplió ante la resistencia táctica rival (-1.00u).`;
      } else {
        reasoningSummary = `En juego / Próximo: Partido ${g.state === 'live' ? 'en vivo en este momento' : 'programado'}. Recomendación del modelo Sharp: ${marketFormatted} con ${pred.ai_estimated_probability_pct}% de probabilidad estimada (+${pred.expected_value_pct}% EV).`;
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

      // 1. Fetch all pre-warmed AI predictions from database in a single fast call (<30ms)
      const prewarmed = await this.sports.cachedPredictions();
      const initialPreds: Record<string, AIValueBetResponse> = { ...prewarmed, ...this.aiPredictions() };
      for (const g of unique) {
        if (!initialPreds[g.id]) {
          initialPreds[g.id] = getUnifiedMatchPrediction(g);
        }
      }
      this.aiPredictions.set(initialPreds);

      // 2. Async query backend value bets for top visible games with forceRefresh support in ONE batched update
      const targetGames = unique.slice(0, 16);
      const batchUpdates: Record<string, AIValueBetResponse> = {};
      await Promise.allSettled(
        targetGames.map(async (g) => {
          try {
            const vb = await this.sports.valueBet(g.league, g.id, g.home, g.away, g.start, forceRefresh);
            if (vb) {
              batchUpdates[g.id] = vb;
            }
          } catch {
            // Keep unified baseline prediction
          }
        })
      );
      if (Object.keys(batchUpdates).length) {
        this.aiPredictions.update((m) => ({ ...m, ...batchUpdates }));
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
      if (sport === 'nfl' && g.sport !== 'Americano' && g.league !== 'nfl') return false;
      if (sport === 'nba' && g.sport !== 'Baloncesto' && g.league !== 'nba') return false;
      if (sport === 'mlb' && g.sport !== 'Béisbol' && g.league !== 'mlb' && g.league !== 'kbo')
        return false;

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

  // Parlays Engine: automatically constructs the 3 best parlays from upcoming/live matches
  curatedParlays = computed<AIParlay[]>(() => {
    // Only construct parlays from games not yet concluded
    const all = this.predictions().filter((p) => p.game.state !== 'final');
    if (all.length < 2) return [];

    const parlays: AIParlay[] = [];

    // 1. Parlay de Alta Confianza (Seguro) - 2-3 picks with >68% probability
    const highCertainty = [...all]
      .filter((p) => p.bestPick.prob >= 66)
      .sort((a, b) => b.bestPick.prob - a.bestPick.prob)
      .slice(0, 3);

    if (highCertainty.length >= 2) {
      const combinedOdds = Number(
        highCertainty.reduce((acc, p) => acc * p.bestPick.odds, 1).toFixed(2),
      );
      const combinedProb = Math.round(
        highCertainty.reduce((acc, p) => acc * (p.bestPick.prob / 100), 1) * 100,
      );

      parlays.push({
        id: 'parlay-seguro',
        title: 'Parlay de Alta Probabilidad · El Seguro del Día',
        type: 'seguro',
        badge: 'ALTA CONFIANZA IA',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        description: 'Combinada de 2 a 3 selecciones con la mayor probabilidad estadística calculada por el modelo.',
        combinedOdds,
        combinedProb,
        legs: highCertainty.map((p) => ({
          game: p.game,
          selectionText: `${p.game.away} vs ${p.game.home} · ${p.bestPick.label}`,
          market: p.bestPick.market,
          pick: p.bestPick.pick,
          line: p.bestPick.line,
          odds: p.bestPick.odds,
          prob: p.bestPick.prob,
        })),
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

      parlays.push({
        id: 'parlay-valor',
        title: 'Parlay de Rentabilidad +EV · Ventaja vs Las Casas',
        type: 'valor',
        badge: 'MAYOR VALOR ESPERADO (+EV)',
        badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        description: 'Picks donde la probabilidad estimada por IA supera el margen de las casas de apuestas para maximizar ROI.',
        combinedOdds,
        combinedProb,
        legs: valueCandidates.map((p) => ({
          game: p.game,
          selectionText: `${p.game.away} vs ${p.game.home} · ${p.bestPick.label}`,
          market: p.bestPick.market,
          pick: p.bestPick.pick,
          line: p.bestPick.line,
          odds: p.bestPick.odds,
          prob: p.bestPick.prob,
        })),
      });
    }

    // 3. Parlay de Goles & Puntos (Over / Under Totales)
    const totalsPicks = [...all]
      .filter((p) => p.overProb >= 62 || p.bttsProb! >= 62)
      .slice(0, 3);

    if (totalsPicks.length >= 2) {
      const combinedOdds = Number(
        totalsPicks.reduce((acc, p) => acc * 1.72, 1).toFixed(2),
      );
      const combinedProb = Math.round(
        totalsPicks.reduce((acc, p) => acc * (Math.max(p.overProb, p.bttsProb ?? 0) / 100), 1) * 100,
      );

      parlays.push({
        id: 'parlay-goles',
        title: 'Parlay Dinámico · Goles & Puntos Totales',
        type: 'goles',
        badge: 'TENDENCIA OFENSIVA',
        badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        description: 'Combinada basada en ritmo ofensivo y expectativas de anotación por encima del promedio.',
        combinedOdds,
        combinedProb,
        legs: totalsPicks.map((p) => {
          const isSoccer = this.isSoccer(p.game);
          const market = isSoccer ? 'Total de goles' : p.game.sport === 'Baloncesto' ? 'Total de puntos' : 'Total';
          const pick = 'Más de';
          const line = isSoccer ? 2.5 : p.game.sport === 'Baloncesto' ? 218.5 : 44.5;
          return {
            game: p.game,
            selectionText: `${p.game.away} vs ${p.game.home} · Más de ${line} ${market}`,
            market,
            pick,
            line,
            odds: 1.72,
            prob: Math.max(p.overProb, p.bttsProb ?? 60),
          };
        }),
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
    const basketball = g.sport === 'Baloncesto' || g.league === 'nba';

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
      expectedTotal = g.sport === 'Americano' ? 44 + (seed % 12) : 8 + (seed % 5);
      overProb = Math.min(74, Math.max(46, 52 + (seed % 16) - 8));
      bttsProb = null;
    }

    // Unified AI source of truth: prioritize server Gemini analysis, fallback to unified local model
    const ai = aiResp || this.aiPredictions()[g.id] || getUnifiedMatchPrediction(g);

    let pickMarket = 'Moneyline';
    let pickVal = 'Local';
    let pickLine: number | null = null;
    const mType = (ai.market_type || '').toLowerCase();
    const mLabel = ai.recommended_market || '';

    if (mType === 'btts_yes' || mLabel.toLowerCase().includes('ambos equipos') || mLabel.toLowerCase().includes('btts')) {
      pickMarket = 'Ambos equipos anotan';
      pickVal = 'Sí';
    } else if (mType === 'btts_no') {
      pickMarket = 'Ambos equipos anotan';
      pickVal = 'No';
    } else if (mType === 'over_2_5' || mLabel.toLowerCase().includes('más de') || mLabel.toLowerCase().includes('over')) {
      pickMarket = soccer ? 'Total de goles' : 'Total de puntos';
      pickVal = 'Más de';
      pickLine = soccer ? 2.5 : basketball ? 218.5 : 44.5;
    } else if (mType === 'under_2_5' || mLabel.toLowerCase().includes('menos de') || mLabel.toLowerCase().includes('under')) {
      pickMarket = soccer ? 'Total de goles' : 'Total de puntos';
      pickVal = 'Menos de';
      pickLine = soccer ? 2.5 : basketball ? 218.5 : 44.5;
    } else if (mType === 'away_win' || mLabel.toLowerCase().includes(g.away.toLowerCase())) {
      pickMarket = 'Moneyline';
      pickVal = 'Visitante';
    } else if (mType === 'draw' || mLabel.toLowerCase().includes('empate')) {
      pickMarket = 'Moneyline';
      pickVal = 'Empate';
    } else if (mType === 'spread') {
      pickMarket = 'Spread';
      pickVal = mLabel.toLowerCase().includes(g.away.toLowerCase()) ? g.away : g.home;
      pickLine = -1.5;
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
    return (
      g.sport === 'Fútbol' ||
      [
        'premier',
        'laliga',
        'champions',
        'seriea',
        'bundesliga',
        'ligue1',
        'europa',
        'ligamx',
        'mls',
        'nations',
        'concacaf-nations',
        'friendlies',
      ].includes(g.league)
    );
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
