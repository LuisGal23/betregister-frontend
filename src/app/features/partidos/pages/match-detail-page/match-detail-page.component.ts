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
  evaluateMarketResult,
  getKnownPlayerHeadshot,
  isBasketballGame,
  isNFLGame,
  isMLBGame,
  isSoccerGame,
  sanitizeAIPredictionForSport,
} from '../../../../shared/utils/match-analysis.utils';
import { getTeamLogo } from '../../../../shared/utils/team-logos.utils';

export interface PlayerPropOption {
  id: string;
  category: string;
  name: string;
  line: number;
  market: string;
  pick: string;
  label: string;
  odds: number;
  prob: number;
  reason: string;
}

export interface PlayerCardView {
  id: string;
  name: string;
  athlete_id?: string;
  jersey: string;
  position: string;
  role: string;
  team: string;
  team_side: 'home' | 'away';
  headshot: string;
  statusText: string;
  marginImpact: string;
  stats: { label: string; value: string }[];
  props: PlayerPropOption[];
}

function buildPlayerCard(p: any, sport: string, league: string, side: 'home' | 'away', teamName: string): PlayerCardView {
  const role = (p.role || p.position || '').toLowerCase();
  const isBasketball = isBasketballGame(sport, league);
  const isNFL = isNFLGame(sport, league);
  const isMLB = isMLBGame(sport, league);

  let stats: { label: string; value: string }[] = [];
  let props: PlayerPropOption[] = [];

  if (isBasketball) {
    const isCenter = role.includes('pívot') || role.includes('center') || p.position === 'C';
    const isGuard = role.includes('base') || role.includes('guard') || p.position === 'G' || p.position === 'PG' || p.position === 'SG';
    const ptsLine = isGuard ? 24.5 : isCenter ? 18.5 : 21.5;
    const rebLine = isCenter ? 10.5 : isGuard ? 4.5 : 7.5;
    const astLine = isGuard ? 6.5 : isCenter ? 2.5 : 4.5;
    const tripLine = isCenter ? 0.5 : 2.5;
    const praLine = Number((ptsLine + rebLine + astLine - 2.5).toFixed(1));

    stats = [
      { label: 'PTS', value: `${(ptsLine + 1.2).toFixed(1)}` },
      { label: 'REB', value: `${(rebLine + 0.8).toFixed(1)}` },
      { label: 'AST', value: `${(astLine + 0.5).toFixed(1)}` },
      { label: 'FG%', value: isCenter ? '58.2%' : '47.6%' },
    ];

    props = [
      {
        id: 'pts',
        category: 'PUNTOS',
        name: 'Puntos',
        line: ptsLine,
        market: 'Puntos de jugador',
        pick: 'Más de',
        label: `Más de ${ptsLine} Puntos (${p.name})`,
        odds: 1.85,
        prob: 64,
        reason: `Promedio de ${(ptsLine + 1.2).toFixed(1)} pts/p con 34+ minutos de juego proyectados`,
      },
      {
        id: 'reb',
        category: 'REBOTES',
        name: 'Rebotes',
        line: rebLine,
        market: 'Rebotes de jugador',
        pick: 'Más de',
        label: `Más de ${rebLine} Rebotes (${p.name})`,
        odds: 1.87,
        prob: 62,
        reason: `Presencia física clave en la pintura defensiva y rebote ofensivo`,
      },
      {
        id: 'ast',
        category: 'ASISTENCIAS',
        name: 'Asistencias',
        line: astLine,
        market: 'Asistencias de jugador',
        pick: 'Más de',
        label: `Más de ${astLine} Asistencias (${p.name})`,
        odds: 1.84,
        prob: 65,
        reason: `Alto uso ofensivo y generación de juego desde el pick & roll`,
      },
      {
        id: 'triples',
        category: 'TRIPLES',
        name: 'Triples',
        line: tripLine,
        market: 'Triples anotados',
        pick: 'Más de',
        label: `Más de ${tripLine} Triples (${p.name})`,
        odds: 1.90,
        prob: 59,
        reason: `Efectividad exterior con 6+ intentos promedio desde el perímetro`,
      },
      {
        id: 'pra',
        category: 'PRA',
        name: 'Pts+Reb+Ast',
        line: praLine,
        market: 'Puntos + Rebotes + Asistencias (PRA)',
        pick: 'Más de',
        label: `Más de ${praLine} PRA (${p.name})`,
        odds: 1.88,
        prob: 66,
        reason: `Línea integral de alto impacto en todas las facetas del juego`,
      },
    ];
  } else if (isNFL) {
    const isQB = role.includes('quarterback') || p.position === 'QB';
    const isRB = role.includes('running') || p.position === 'RB';
    if (isQB) {
      stats = [
        { label: 'YDS/P', value: '254.2' },
        { label: 'TD/P', value: '1.9' },
        { label: 'COMP%', value: '68.4%' },
        { label: 'QBR', value: '74.1' },
      ];
      props = [
        {
          id: 'pass_td',
          category: 'PASES TD',
          name: 'Pases TD',
          line: 1.5,
          market: 'Pases de touchdown de QB',
          pick: 'Más de',
          label: `Más de 1.5 Pases de TD (${p.name})`,
          odds: 1.80,
          prob: 66,
          reason: `Esquema de zona roja enfocado en ataque aéreo`,
        },
        {
          id: 'pass_yds',
          category: 'YARDAS',
          name: 'Yardas Pase',
          line: 245.5,
          market: 'Yardas por pase de QB',
          pick: 'Más de',
          label: `Más de 245.5 Yardas de pase (${p.name})`,
          odds: 1.85,
          prob: 62,
          reason: `Volumen proyectado superior a 35 envíos`,
        },
        {
          id: 'pass_comp',
          category: 'COMPLETOS',
          name: 'Pases Completos',
          line: 21.5,
          market: 'Pases completos de QB',
          pick: 'Más de',
          label: `Más de 21.5 Pases completos (${p.name})`,
          odds: 1.83,
          prob: 64,
          reason: `Rutas cortas y ritmo alto de pases en 1er y 2do down`,
        },
      ];
    } else {
      stats = [
        { label: isRB ? 'RUSH YDS' : 'REC YDS', value: '74.6' },
        { label: 'TD TOTAL', value: '0.8' },
        { label: isRB ? 'CAR' : 'REC', value: isRB ? '17.4' : '6.2' },
        { label: 'Y/ATT', value: isRB ? '4.7' : '12.8' },
      ];
      props = [
        {
          id: 'yds',
          category: 'YARDAS',
          name: 'Yardas Totales',
          line: 64.5,
          market: isRB ? 'Yardas terrestres' : 'Yardas por pase de QB',
          pick: 'Más de',
          label: `Más de 64.5 Yardas (${p.name})`,
          odds: 1.85,
          prob: 63,
          reason: `Principal arma ofensiva en jugadas de avance primario`,
        },
        {
          id: 'anytime_td',
          category: 'TD',
          name: 'Anotará TD',
          line: 0.5,
          market: 'Touchdown en cualquier momento',
          pick: 'Anotará TD',
          label: `Anotará Touchdown (${p.name})`,
          odds: 2.10,
          prob: 54,
          reason: `Primer objetivo designado en la línea de gol rival`,
        },
      ];
    }
  } else if (isMLB) {
    stats = [
      { label: 'AVG', value: '.288' },
      { label: 'OBP', value: '.362' },
      { label: 'HR', value: '24' },
      { label: 'OPS', value: '.884' },
    ];
    props = [
      {
        id: 'hits',
        category: 'HITS',
        name: 'Hits',
        line: 1.5,
        market: 'Hits de bateador',
        pick: 'Más de',
        label: `Más de 1.5 Hits (${p.name})`,
        odds: 1.95,
        prob: 58,
        reason: `Racha de 7 juegos consecutivos conectando de hit`,
      },
      {
        id: 'bases',
        category: 'BASES',
        name: 'Bases Totales',
        line: 1.5,
        market: 'Hits de bateador',
        pick: 'Más de',
        label: `Más de 1.5 Bases Totales (${p.name})`,
        odds: 1.88,
        prob: 61,
        reason: `Poder de extrabase ante lanzadores rivales`,
      },
    ];
  } else {
    // Soccer (Fútbol)
    const isForward = role.includes('delantero') || role.includes('extremo') || p.position === 'DEL' || p.position === 'FW';
    const isMidfielder = role.includes('medio') || role.includes('volante') || p.position === 'MED' || p.position === 'MF';

    stats = [
      { label: 'GOLES', value: isForward ? '16' : '6' },
      { label: 'ASIST', value: isForward ? '7' : '9' },
      { label: 'TIROS/P', value: isForward ? '3.4' : '1.8' },
      { label: 'PASES%', value: isMidfielder ? '89%' : '78%' },
    ];

    props = [
      {
        id: 'sot',
        category: 'A PUERTA',
        name: 'Tiros a puerta',
        line: isForward ? 1.5 : 0.5,
        market: 'Tiros a puerta de jugador',
        pick: 'Más de',
        label: `Más de ${isForward ? 1.5 : 0.5} Tiros a puerta (${p.name})`,
        odds: 1.85,
        prob: 65,
        reason: `Promedio de 2.2 remates bajo los tres palos en partidos de local/visita`,
      },
      {
        id: 'shots',
        category: 'REMATES',
        name: 'Remates totales',
        line: isForward ? 2.5 : 1.5,
        market: 'Tiros totales de jugador',
        pick: 'Más de',
        label: `Más de ${isForward ? 2.5 : 1.5} Remates (${p.name})`,
        odds: 1.80,
        prob: 68,
        reason: `Constante búsqueda del arco desde media y larga distancia`,
      },
      {
        id: 'goal',
        category: 'GOL',
        name: 'Anotará gol',
        line: 0.5,
        market: 'Goleador en cualquier momento',
        pick: 'Anotará',
        label: `Gol en cualquier momento (${p.name})`,
        odds: 2.35,
        prob: 45,
        reason: `Cobrador principal de penales y tiros libres directos`,
      },
      {
        id: 'passes',
        category: 'PASES',
        name: 'Pases completados',
        line: isMidfielder ? 52.5 : 38.5,
        market: 'Pases de jugador',
        pick: 'Más de',
        label: `Más de ${isMidfielder ? 52.5 : 38.5} Pases (${p.name})`,
        odds: 1.85,
        prob: 67,
        reason: `Eje distribuidor de posesión con 60+ toques proyectados`,
      },
    ];
  }

  return {
    id: p.name,
    name: p.name,
    athlete_id: p.athlete_id,
    jersey: p.jersey || (p.team_side === 'home' ? '9' : '10'),
    position: p.position || (isBasketball ? 'G' : isNFL ? 'QB' : 'DEL'),
    role: p.role || (isBasketball ? 'Titular NBA' : isNFL ? 'Titular NFL' : 'Delantero Titular'),
    team: teamName,
    team_side: side,
    headshot: p.headshot || '',
    statusText: p.statusText || 'Titular confirmado',
    marginImpact: p.marginImpact || '+1.5 pts',
    stats,
    props,
  };
}

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

  // Track selected prop index for each player card
  selectedPropIndex = signal<Record<string, number>>({});

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

  isSoccerMatch = computed(() => {
    const g = this.game();
    const d = this.details();
    return isSoccerGame(g?.sport || d?.sport, g?.league || this.league());
  });

  isBasketballMatch = computed(() => {
    const g = this.game();
    const d = this.details();
    return isBasketballGame(g?.sport || d?.sport, g?.league || this.league());
  });

  isNFLMatch = computed(() => {
    const g = this.game();
    const d = this.details();
    return isNFLGame(g?.sport || d?.sport, g?.league || this.league());
  });

  isMLBMatch = computed(() => {
    const g = this.game();
    const d = this.details();
    return isMLBGame(g?.sport || d?.sport, g?.league || this.league());
  });

  // Top 3 alternative options with probabilities
  alternativeOptions = computed<AlternativeMarketOption[]>(() => {
    const g = this.game();
    if (!g) return [];
    const ai = sanitizeAIPredictionForSport(this.aiValueBet(), g);
    if (ai?.alternative_options && ai.alternative_options.length) {
      return ai.alternative_options.slice(0, 3);
    }
    const unified = getUnifiedMatchPrediction(g);
    return unified.alternative_options || [];
  });

  // Key players with large cards & interactive props (never empty)
  topPropsPlayers = computed<PlayerCardView[]>(() => {
    const d = this.details();
    const g = this.game();
    if (!g) return [];

    const homeName = g.home;
    const awayName = g.away;
    const sport = g.sport || d?.sport || 'Fútbol';
    const league = g.league || this.league() || '';

    // 1. If d.star_players exists and has entries, use them
    if (d?.star_players && d.star_players.length > 0) {
      return d.star_players.map((s) => {
        const side = s.team_side || 'home';
        const team = side === 'home' ? homeName : awayName;
        return buildPlayerCard(s, sport, league, side, team);
      });
    }

    // 2. If d.players exists, select the top 3 away and top 3 home starters!
    if (d?.players && d.players.length > 0) {
      const awayList = d.players.filter((p) => p.team_side === 'away').slice(0, 3);
      const homeList = d.players.filter((p) => p.team_side === 'home').slice(0, 3);
      const combined = [...awayList, ...homeList];
      if (combined.length > 0) {
        return combined.map((p) => {
          const side = p.team_side || 'home';
          const team = side === 'home' ? homeName : awayName;
          return buildPlayerCard(p, sport, league, side, team);
        });
      }
    }

    // 3. Fallback: generate deep analysis synthetic stars
    const synthetic = generateDeepAnalysis(g);
    if (synthetic.star_players?.length) {
      return synthetic.star_players.map((s) => {
        const side = s.team_side || 'home';
        const team = side === 'home' ? homeName : awayName;
        return buildPlayerCard(s, sport, league, side, team);
      });
    }

    return [];
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

        // Async fetch server Gemini prediction (sanitized for sport coherence)
        this.sports
          .valueBet(league, matchId, g.home, g.away, g.start)
          .then((vb) => {
            if (vb) {
              this.aiValueBet.set(sanitizeAIPredictionForSport(vb, g));
            }
          })
          .catch(() => {});
      }
    } catch {
      // Fallback synthetic details if network is offline
      const l = league.toLowerCase();
      const synthSport = l === 'nba' ? 'Básquetbol' : l === 'nfl' ? 'Americano' : l === 'mlb' ? 'Béisbol' : 'Fútbol';
      const syntheticGame: SportsGame = {
        id: matchId,
        league,
        league_name: league.toUpperCase(),
        sport: synthSport,
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
        this.aiValueBet.set(sanitizeAIPredictionForSport(vb, g));
      }
    } catch {
      // Keep existing
    } finally {
      this.loadingAi.set(false);
    }
  }

  // Active prop selection management
  getSelectedProp(player: PlayerCardView): PlayerPropOption {
    const idx = this.selectedPropIndex()[player.name] ?? 0;
    return player.props[idx] || player.props[0];
  }

  selectProp(player: PlayerCardView, index: number) {
    this.selectedPropIndex.update((curr) => ({
      ...curr,
      [player.name]: index,
    }));
  }

  addPlayerPropToTicket(player: PlayerCardView, prop?: PlayerPropOption) {
    const targetProp = prop || this.getSelectedProp(player);
    const g = this.game();
    if (!g || !targetProp) return;

    this.ticketModal.open({
      game: g,
      market: targetProp.market,
      pick: targetProp.pick,
      line: targetProp.line,
      odds: targetProp.odds,
      description: targetProp.label,
      eventLabel: `${g.away} vs ${g.home} · ${player.name} · ${targetProp.label}`,
    });
  }

  // Audits the 3 alternative options
  evalAlternativeOption(opt: AlternativeMarketOption): 'WON' | 'LOST' | 'PENDING' {
    const g = this.game();
    if (!g) return 'PENDING';
    return evaluateMarketResult(opt.market, opt.tag, g);
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
      description: label,
      eventLabel: `${g.away} vs ${g.home} · ${label}`,
    });
  }

  getLogo(teamName: string, sport?: string, existing?: string | null): string {
    if (existing) return existing;
    return getTeamLogo(teamName, sport) || '';
  }

  getPropForPlayer(p: any): { label: string; market: string; pick: string; line: number; prob: number } {
    const g = this.game();
    const sport = g?.sport || this.details()?.sport || 'Fútbol';
    const league = g?.league || this.league() || '';
    const isBasketball = isBasketballGame(sport, league);
    const isNFL = isNFLGame(sport, league);
    const isMLB = isMLBGame(sport, league);

    if (isBasketball) {
      const isPlaymaker = (p.role || '').toLowerCase().includes('base') || (p.position || '') === 'G';
      if (isPlaymaker) {
        return { label: `Más de 6.5 Asistencias (${p.name})`, market: 'Asistencias de jugador', pick: 'Más de', line: 6.5, prob: 64 };
      }
      return { label: `Más de 24.5 Puntos (${p.name})`, market: 'Puntos de jugador', pick: 'Más de', line: 24.5, prob: 62 };
    }

    if (isNFL) {
      const isQB = (p.role || '').toLowerCase().includes('quarterback') || (p.position || '') === 'QB';
      if (isQB) {
        return { label: `Más de 1.5 Pases de TD (${p.name})`, market: 'Pases de touchdown de QB', pick: 'Más de', line: 1.5, prob: 65 };
      }
      return { label: `Más de 64.5 Yardas totales (${p.name})`, market: 'Yardas terrestres', pick: 'Más de', line: 64.5, prob: 61 };
    }

    if (isMLB) {
      return { label: `Más de 1.5 Hits (${p.name})`, market: 'Hits de bateador', pick: 'Más de', line: 1.5, prob: 60 };
    }

    // Soccer
    const isForward = (p.role || '').toLowerCase().includes('delantero') || (p.role || '').toLowerCase().includes('extremo') || (p.position || '') === 'DEL';
    if (isForward) {
      return { label: `Más de 1.5 Tiros a puerta (${p.name})`, market: 'Tiros a puerta de jugador', pick: 'Más de', line: 1.5, prob: 66 };
    }
    return { label: `Más de 48.5 Pases completados (${p.name})`, market: 'Pases de jugador', pick: 'Más de', line: 48.5, prob: 68 };
  }

  getPlayerHeadshot(p: { name: string; athlete_id?: string | null; headshot?: string | null }): string {
    if (p.headshot && !p.headshot.includes('ui-avatars.com')) {
      return p.headshot;
    }
    const g = this.game();
    const sport = g?.sport || this.details()?.sport || '';
    const league = g?.league || this.league() || '';
    const isNba = isBasketballGame(sport, league);
    const isNfl = isNFLGame(sport, league);
    const isMlb = isMLBGame(sport, league);

    if (p.athlete_id) {
      if (isNba) return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${p.athlete_id}.png&w=350&h=254`;
      if (isNfl) return `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${p.athlete_id}.png&w=350&h=254`;
      if (isMlb) return `https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/${p.athlete_id}.png&w=350&h=254`;
      return `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${p.athlete_id}.png&w=350&h=254`;
    }

    const known = getKnownPlayerHeadshot(p.name);
    if (known && !known.includes('ui-avatars.com')) return known;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'Jugador')}&background=0f172a&color=38bdf8&bold=true&size=256`;
  }

  onPlayerImgError(event: Event, name?: string | null, athleteId?: string | null) {
    const img = event.target as HTMLImageElement;
    if (!img) return;

    if (athleteId && !img.src.includes('cdn.nba.com')) {
      img.src = `https://cdn.nba.com/headshots/nba/latest/1040x760/${athleteId}.png`;
      return;
    }

    const known = getKnownPlayerHeadshot(name || '');
    if (known && !known.includes('ui-avatars.com') && img.src !== known) {
      img.src = known;
      return;
    }

    const clean = (name || 'Jugador').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=0f172a&color=38bdf8&bold=true&size=256`;
  }
}
