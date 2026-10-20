import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { SportsService } from '../../../partidos/services/sports.service';
import type { Bet } from '../../../apuestas/services/bet.model';
import type { League, SportsGame } from '../../../partidos/services/sports.model';
import type { TipsterPost } from '../../services/community.model';

@Component({
  selector: 'app-publicar-pronostico-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publicar-pronostico-modal.component.html',
})
export class PublicarPronosticoModalComponent {
  api = inject(ApiService);
  vm = inject(LedgerState);
  sportsService = inject(SportsService);

  isOpen = model<boolean>(false);
  postCreated = output<TipsterPost>();

  creatingPost = signal(false);
  createError = signal('');

  // Mode: 'ticket', 'api', 'manual'
  creationTab = signal<'ticket' | 'api' | 'manual'>('ticket');

  // Form fields
  selectedTicket = signal<Bet | null>(null);
  selectedTicketId = signal<number | null>(null);

  newPostEvent = signal('');
  newPostSport = signal('Fútbol');
  newPostLeague = signal('');
  newPostMarket = signal('Goles');
  newPostPick = signal('');
  newPostOdds = signal('1.90');
  newPostUnits = signal(1.5);
  newPostRationale = signal('');
  newPostHome = signal('');
  newPostAway = signal('');
  newPostHomeLogo = signal('');
  newPostAwayLogo = signal('');

  // Sports APIs integration
  apiLeagues = signal<League[]>([]);
  selectedApiLeague = signal('uefa.champions');
  apiMatches = signal<SportsGame[]>([]);
  loadingApiMatches = signal(false);
  selectedApiGameId = signal<string>('');

  userTickets = computed(() => this.vm.data().bets.slice(0, 25));

  close() {
    this.isOpen.set(false);
  }

  selectTicket(bet: Bet) {
    this.selectedTicket.set(bet);
    this.selectedTicketId.set(bet.id);

    this.newPostEvent.set(bet.event);
    this.newPostOdds.set(String(bet.odds || '1.90'));
    this.newPostSport.set(bet.sport_tag || 'Fútbol');
    this.newPostLeague.set(bet.league_tag || '');
    this.newPostMarket.set(bet.market_tag || 'Mercado General');
    this.newPostPick.set(bet.event.includes('-') ? bet.event.split('-')[1].trim() : bet.event);

    const unitVal = Number(this.vm.data().profile.units?.value) || 100;
    const stakeVal = this.vm.converted(bet.stake, bet.currency as any) || (bet.stake / 100);
    const units = Math.max(0.5, Math.round((stakeVal / unitVal) * 2) / 2);
    this.newPostUnits.set(units);

    if (bet.linked_games && bet.linked_games[0]) {
      const g = bet.linked_games[0];
      this.newPostHome.set(g.home);
      this.newPostAway.set(g.away);
      this.newPostHomeLogo.set(g.home_logo || '');
      this.newPostAwayLogo.set(g.away_logo || '');
    } else {
      this.newPostHome.set('');
      this.newPostAway.set('');
      this.newPostHomeLogo.set('');
      this.newPostAwayLogo.set('');
    }
  }

  async loadApiLeagues() {
    if (this.apiLeagues().length > 0) return;
    try {
      const res = await this.sportsService.leagues();
      if (res?.leagues) {
        this.apiLeagues.set(res.leagues);
        if (res.leagues.length > 0) {
          this.selectedApiLeague.set(res.leagues[0].id);
          void this.loadApiMatches();
        }
      }
    } catch {
      this.apiLeagues.set([
        { id: 'uefa.champions', sport: 'Fútbol', name: 'Champions League', source: 'espn', configured: true },
        { id: 'eng.1', sport: 'Fútbol', name: 'Premier League', source: 'espn', configured: true },
        { id: 'esp.1', sport: 'Fútbol', name: 'LaLiga España', source: 'espn', configured: true },
        { id: 'mex.1', sport: 'Fútbol', name: 'Liga MX', source: 'espn', configured: true },
        { id: 'football/nfl', sport: 'NFL', name: 'NFL', source: 'espn', configured: true },
        { id: 'baseball/mlb', sport: 'Béisbol', name: 'MLB', source: 'espn', configured: true },
      ]);
      void this.loadApiMatches();
    }
  }

  async onApiLeagueChange(leagueId: string) {
    this.selectedApiLeague.set(leagueId);
    await this.loadApiMatches();
  }

  async loadApiMatches() {
    this.loadingApiMatches.set(true);
    const league = this.selectedApiLeague();
    const today = new Date().toISOString().slice(0, 10);
    try {
      const sb = await this.sportsService.events(league, today);
      this.apiMatches.set(sb?.events || []);
    } catch {
      this.apiMatches.set([]);
    } finally {
      this.loadingApiMatches.set(false);
    }
  }

  selectApiGame(game: SportsGame) {
    this.selectedApiGameId.set(game.id);
    const eventName = `${game.home} vs ${game.away}`;
    this.newPostEvent.set(eventName);
    this.newPostHome.set(game.home);
    this.newPostAway.set(game.away);
    this.newPostHomeLogo.set(game.home_logo || '');
    this.newPostAwayLogo.set(game.away_logo || '');
    this.newPostSport.set(game.sport || 'Fútbol');
    this.newPostLeague.set(game.league_name || game.league);
    this.newPostMarket.set('Moneyline / Ganador');
    this.newPostPick.set(`${game.home} a Ganar`);
  }

  async submitPost() {
    if (!this.newPostEvent().trim()) {
      this.createError.set('Por favor selecciona o escribe el evento deportivo.');
      return;
    }
    if (!this.newPostPick().trim()) {
      this.createError.set('Escribe tu pronóstico o selección (ej. Ambos Anotan - Sí).');
      return;
    }
    if (!this.newPostRationale().trim() || this.newPostRationale().trim().length < 5) {
      this.createError.set('Escribe una breve justificación o análisis de tu apuesta.');
      return;
    }

    this.creatingPost.set(true);
    this.createError.set('');

    const p = this.vm.data().profile;
    const authorUsername = p.username || (p.email ? p.email.split('@')[0] : 'usuario');
    const authorDisplayName = p.display_name || authorUsername;
    const authorAvatar = p.avatar_url || '';

    const payload = {
      bet_id: this.selectedTicketId(),
      event: this.newPostEvent().trim(),
      sport: this.newPostSport(),
      league: this.newPostLeague().trim() || 'General',
      market: this.newPostMarket().trim(),
      pick: this.newPostPick().trim(),
      odds: this.newPostOdds().trim() || '1.90',
      units: Number(this.newPostUnits()) || 1.0,
      rationale: this.newPostRationale().trim(),
      home: this.newPostHome() || undefined,
      away: this.newPostAway() || undefined,
      home_logo: this.newPostHomeLogo() || undefined,
      away_logo: this.newPostAwayLogo() || undefined,
    };

    const newPostObj: TipsterPost = {
      id: `post_local_${Date.now()}`,
      bet_id: this.selectedTicketId(),
      author: {
        username: authorUsername,
        display_name: authorDisplayName,
        avatar_url: authorAvatar,
        is_verified: false,
        badge: 'Tipster de la Comunidad',
        stats: {
          yield: '+18.5%',
          win_rate: '62.0%',
          units: '+14.0u',
          streak: '🔥 2G',
        },
      },
      created_at: 'Hace un momento',
      sport: payload.sport,
      league: payload.league,
      event: payload.event,
      home: payload.home,
      away: payload.away,
      home_logo: payload.home_logo,
      away_logo: payload.away_logo,
      market: payload.market,
      pick: payload.pick,
      odds: payload.odds,
      units: payload.units,
      rationale: payload.rationale,
      reactions: { fire: 1, like: 1, copies: 0 },
      status: 'pending',
    };

    try {
      const stored = localStorage.getItem('betregister_community_posts');
      const list: TipsterPost[] = stored ? JSON.parse(stored) : [];
      list.unshift(newPostObj);
      localStorage.setItem('betregister_community_posts', JSON.stringify(list));
    } catch {}

    this.postCreated.emit(newPostObj);

    try {
      await this.api.request('/community/posts', payload);
    } catch (e) {
      console.warn('Community post synced locally (remote pending):', e);
    } finally {
      this.creatingPost.set(false);
      this.close();
      this.resetForm();
    }
  }

  resetForm() {
    this.selectedTicket.set(null);
    this.selectedTicketId.set(null);
    this.selectedApiGameId.set('');
    this.newPostEvent.set('');
    this.newPostLeague.set('');
    this.newPostPick.set('');
    this.newPostRationale.set('');
    this.newPostUnits.set(1.5);
    this.newPostOdds.set('1.90');
    this.newPostHome.set('');
    this.newPostAway.set('');
    this.newPostHomeLogo.set('');
    this.newPostAwayLogo.set('');
  }
}
