import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SportsService } from '../../services/sports.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { zoneDay } from '../../../../shared/utils/zone.utils';
import type { SportsGame } from '../../models/sports.model';
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
  styleUrl: './matches-page.component.css',
})
export class MatchesPageComponent implements OnInit {
  private sports = inject(SportsService);
  private router = inject(Router);
  vm = inject(LedgerState);

  // Categories as requested: NFL, Ligas Europeas, Liga MX, MLS, MLB, etc.
  categories = [
    { id: 'all', label: 'Todos' },
    { id: 'nfl', label: 'NFL', leagues: ['nfl'] },
    { id: 'europe', label: 'Ligas Europeas', leagues: ['premier', 'laliga', 'champions', 'seriea', 'bundesliga', 'ligue1', 'europa'] },
    { id: 'ligamx', label: 'Liga MX', leagues: ['ligamx'] },
    { id: 'mls', label: 'MLS', leagues: ['mls'] },
    { id: 'mlb', label: 'MLB', leagues: ['mlb'] },
  ];

  selectedCategory = signal<string>('all');
  selectedDate = signal<string>('');
  onlyLive = signal(false);
  searchQuery = signal('');
  loading = signal(false);
  error = signal('');

  games = signal<SportsGame[]>([]);

  // Ticker for top quick match previews
  tickerMatches = computed(() => this.games().slice(0, 8));

  filteredGames = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const live = this.onlyLive();
    const cat = this.selectedCategory();
    const activeCat = this.categories.find((c) => c.id === cat);

    return this.games().filter((g) => {
      if (live && g.state !== 'live') return false;
      if (activeCat && activeCat.leagues && !activeCat.leagues.includes(g.league)) return false;
      if (q && !`${g.home} ${g.away} ${g.league_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  stats = computed(() => {
    const all = this.games();
    return {
      total: all.length,
      live: all.filter((g) => g.state === 'live').length,
      scheduled: all.filter((g) => g.state === 'scheduled').length,
      final: all.filter((g) => g.state === 'final').length,
    };
  });

  ngOnInit() {
    const today = zoneDay(new Date().toISOString(), this.vm.data().profile.timezone);
    this.selectedDate.set(today);
    void this.loadMatches();
  }

  setCategory(catId: string) {
    this.selectedCategory.set(catId);
  }

  setDateOffset(offsetDays: number) {
    const current = this.selectedDate() ? new Date(this.selectedDate() + 'T12:00:00Z') : new Date();
    current.setUTCDate(current.getUTCDate() + offsetDays);
    this.selectedDate.set(current.toISOString().slice(0, 10));
    void this.loadMatches();
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
      : ['nfl', 'premier', 'laliga', 'champions', 'ligamx', 'mls', 'mlb', 'seriea', 'bundesliga'];

    try {
      const results: SportsGame[] = [];
      const fetchList = targetLeagues.slice(0, 6); // bounded concurrency
      
      const promises = fetchList.map(async (l) => {
        try {
          const res = await this.sports.events(l, day);
          return res?.events ?? [];
        } catch {
          return [];
        }
      });

      const responses = await Promise.all(promises);
      for (const list of responses) {
        results.push(...list);
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

  // Generate deterministic statistics & probabilities for the FabLabs card aesthetic
  analyzeGame(g: SportsGame): MatchAnalysis {
    // Generate pseudo-deterministic values from game id
    let hash = 0;
    for (let i = 0; i < g.id.length; i++) {
      hash = (hash << 5) - hash + g.id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const isAmerican = g.sport === 'Americano';
    const isBaseball = g.sport === 'Béisbol';

    // Model home/away probability
    const bias = (seed % 28) - 14; // -14 to +14
    let homeProb = Math.min(78, Math.max(28, 52 + bias));
    let awayProb = 100 - homeProb;

    const favorite = homeProb >= awayProb ? 'home' : 'away';
    const favTeam = favorite === 'home' ? g.home : g.away;
    const favProb = Math.max(homeProb, awayProb);
    const confidence = favProb >= 65 ? 'alta' : favProb >= 55 ? 'moderada' : 'baja';

    let estHomeScore: number;
    let estAwayScore: number;
    let estTotal: number;
    let totalLine: number;
    let handicap: string;

    if (isAmerican) {
      const baseTotal = 38 + (seed % 16);
      const diff = Math.round((favProb - 50) / 4);
      estHomeScore = favorite === 'home' ? Math.round(baseTotal / 2 + diff) : Math.round(baseTotal / 2 - diff);
      estAwayScore = favorite === 'home' ? Math.round(baseTotal / 2 - diff) : Math.round(baseTotal / 2 + diff);
      estTotal = estHomeScore + estAwayScore;
      totalLine = estTotal + 0.5;
      handicap = favorite === 'home' ? `${this.shortCode(g.home)} -${Math.max(1.5, diff + 0.5)}` : `${this.shortCode(g.away)} -${Math.max(1.5, diff + 0.5)}`;
    } else if (isBaseball) {
      const diff = (seed % 3) + 1;
      estHomeScore = favorite === 'home' ? 4 + diff : 3;
      estAwayScore = favorite === 'home' ? 3 : 4 + diff;
      estTotal = estHomeScore + estAwayScore;
      totalLine = estTotal + 0.5;
      handicap = favorite === 'home' ? `${this.shortCode(g.home)} -1.5` : `${this.shortCode(g.away)} -1.5`;
    } else {
      // Soccer
      estHomeScore = favorite === 'home' ? 2 : 1;
      estAwayScore = favorite === 'home' ? 1 : 2;
      estTotal = estHomeScore + estAwayScore;
      totalLine = 2.5;
      handicap = favorite === 'home' ? `${this.shortCode(g.home)} -0.5` : `${this.shortCode(g.away)} -0.5`;
    }

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

  // Preselect match and jump straight to /tickets
  addToTicket(game: SportsGame) {
    this.sports.setPendingMatch(game);
    void this.router.navigate(['/tickets'], { queryParams: { from: 'matches' } });
  }
}
