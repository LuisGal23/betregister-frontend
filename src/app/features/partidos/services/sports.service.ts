import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { EspnLiveService } from './espn-live.service';
import type { League, Scoreboard, BetScores, SportsGame, MatchDetails, AIValueBetResponse } from './sports.model';

@Injectable({ providedIn: 'root' })
export class SportsService {
  private api = inject(ApiService);
  private espnLive = inject(EspnLiveService);
  readonly pendingMatch = signal<SportsGame | null>(null);

  // High-performance client-side cache & request deduplication (Coalescing)
  private readonly EVENTS_TTL_MS = 5 * 60 * 1000; // 5 minutes cache for daily schedules
  private readonly DETAILS_TTL_MS = 3 * 60 * 1000; // 3 minutes cache for deep match details

  private eventsCache = new Map<string, { timestamp: number; data: Scoreboard }>();
  private detailsCache = new Map<string, { timestamp: number; data: MatchDetails }>();

  private inFlightEvents = new Map<string, Promise<Scoreboard>>();
  private inFlightDetails = new Map<string, Promise<MatchDetails>>();

  constructor() {
    this.hydrateFromSessionStorage();
  }

  setPendingMatch(game: SportsGame | null) {
    this.pendingMatch.set(game);
  }

  leagues() {
    return this.api.request<{ leagues: League[] }>('/sports/leagues');
  }

  /**
   * Fetches events for a given league and day with in-memory & sessionStorage cache and in-flight deduplication.
   */
  async events(league: string, day: string, forceRefresh = false): Promise<Scoreboard> {
    const cacheKey = `${league}_${day}`;
    const now = Date.now();

    // 1. Check in-memory cache
    if (!forceRefresh) {
      const cached = this.eventsCache.get(cacheKey);
      if (cached && now - cached.timestamp < this.EVENTS_TTL_MS) {
        return cached.data;
      }
    }

    // 2. In-flight request deduplication (join pending network call)
    if (this.inFlightEvents.has(cacheKey)) {
      return this.inFlightEvents.get(cacheKey)!;
    }

    // 3. Initiate single network request
    const promise = (async () => {
      try {
        let result: Scoreboard | null = null;

        // Try backend proxy first with short timeout
        try {
          const res = await this.api.request<Scoreboard>(
            `/sports/events?league=${encodeURIComponent(league)}&day=${encodeURIComponent(day)}`,
            undefined,
            4000
          );
          if (res && Array.isArray(res.events) && res.events.length) {
            result = res;
          }
        } catch {
          // Backend offline or timeout; proceed to live ESPN
        }

        // Zero-downtime direct ESPN fallback
        if (!result) {
          const liveEvents = await this.espnLive.fetchLiveScoreboard(league, day);
          result = {
            league,
            date: day,
            timezone: 'America/Mexico_City',
            events: liveEvents,
            source: 'espn-live',
            updated_at: new Date().toISOString(),
            stale: false,
            message: 'OK',
            configured: true,
            refresh_seconds: 60,
          };
        }

        // Save in cache
        this.eventsCache.set(cacheKey, { timestamp: Date.now(), data: result });
        this.saveToSessionStorage(`br_events_${cacheKey}`, result);
        return result;
      } finally {
        this.inFlightEvents.delete(cacheKey);
      }
    })();

    this.inFlightEvents.set(cacheKey, promise);
    return promise;
  }

  /**
   * Fetches complete match details with 3-minute cache and in-flight deduplication.
   */
  async details(league: string, id: string, game?: SportsGame, forceRefresh = false): Promise<MatchDetails> {
    const cacheKey = `${league}_${id}`;
    const now = Date.now();

    // 1. Check in-memory cache
    if (!forceRefresh) {
      const cached = this.detailsCache.get(cacheKey);
      if (cached && now - cached.timestamp < this.DETAILS_TTL_MS) {
        return cached.data;
      }
    }

    // 2. In-flight request deduplication
    if (this.inFlightDetails.has(cacheKey)) {
      return this.inFlightDetails.get(cacheKey)!;
    }

    // 3. Initiate single network request
    const promise = (async () => {
      try {
        let liveDetails: MatchDetails | null = null;
        if (game) {
          liveDetails = await this.espnLive.fetchLiveSummary(game);
        }

        if (!liveDetails) {
          try {
            liveDetails = await this.api.request<MatchDetails>(
              `/sports/event-details?league=${encodeURIComponent(league)}&id=${encodeURIComponent(id)}`,
              undefined,
              6000
            );
          } catch (err) {
            if (game) {
              liveDetails = await this.espnLive.fetchLiveSummary(game);
            }
            if (!liveDetails) throw err;
          }
        }

        this.detailsCache.set(cacheKey, { timestamp: Date.now(), data: liveDetails });
        return liveDetails;
      } finally {
        this.inFlightDetails.delete(cacheKey);
      }
    })();

    this.inFlightDetails.set(cacheKey, promise);
    return promise;
  }

  scores(id: number) {
    return this.api.request<BetScores>(`/sports/bets/${id}`, undefined, 90000);
  }

  /**
   * Fetches +EV Sharp Bettor analysis for a match (cached in DB for 6 hours).
   */
  async valueBet(
    league: string,
    matchId: string,
    home = '',
    away = '',
    date = ''
  ): Promise<AIValueBetResponse> {
    const params = new URLSearchParams({
      league,
      home,
      away,
      date,
    });
    return this.api.request<AIValueBetResponse>(
      `/sports/matches/${encodeURIComponent(matchId)}/value-bet?${params.toString()}`,
      undefined,
      15000
    );
  }

  /**
   * Resolves player image from backend cache / TheSportsDB with fallback.
   */
  async playerImage(name: string): Promise<string> {
    try {
      const res = await this.api.request<{ name: string; image_url: string }>(
        `/sports/players/image?name=${encodeURIComponent(name)}`,
        undefined,
        6000
      );
      return res.image_url;
    } catch {
      const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=1e293b&color=10b981&bold=true&size=256`;
    }
  }

  clearCache() {
    this.eventsCache.clear();
    this.detailsCache.clear();
  }

  private hydrateFromSessionStorage() {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('br_events_')) {
          const raw = sessionStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.timestamp && parsed.data) {
              if (Date.now() - parsed.timestamp < this.EVENTS_TTL_MS) {
                const subKey = key.replace('br_events_', '');
                this.eventsCache.set(subKey, parsed);
              }
            }
          }
        }
      }
    } catch {
      // sessionStorage unavailable or quota exceeded
    }
  }

  private saveToSessionStorage(key: string, data: any) {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      sessionStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch {
      // ignore quota errors
    }
  }
}
