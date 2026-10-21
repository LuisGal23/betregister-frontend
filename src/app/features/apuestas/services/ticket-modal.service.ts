import { Injectable, signal } from '@angular/core';
import type { GameReference } from '../../partidos/services/sports.model';
import type { SelectionDetail } from './selection-detail';
import type { BetLeg } from './bet.model';

export interface InitialBetOption {
  game?: GameReference | null;
  games?: GameReference[] | null;
  betType?: 'simple' | 'parlay' | 'same_game';
  odds?: number | null;
  market?: string | null;
  pick?: string | null;
  line?: number | null;
  description?: string | null;
  eventLabel?: string | null;
  predictionId?: number | null;
  selections?: SelectionDetail[] | null;
  legs?: BetLeg[] | null;
}

@Injectable({ providedIn: 'root' })
export class TicketModalService {
  readonly isOpen = signal(false);
  readonly initialGame = signal<GameReference | null>(null);
  readonly initialOption = signal<InitialBetOption | null>(null);

  open(gameOrOption?: GameReference | InitialBetOption | null) {
    if (!gameOrOption) {
      this.initialGame.set(null);
      this.initialOption.set(null);
    } else if ('id' in gameOrOption && 'home' in gameOrOption) {
      this.initialGame.set(gameOrOption as GameReference);
      this.initialOption.set({ game: gameOrOption as GameReference });
    } else {
      const opt = gameOrOption as InitialBetOption;
      this.initialGame.set(opt.game ?? (opt.games?.[0] ?? null));
      this.initialOption.set(opt);
    }
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.initialGame.set(null);
    this.initialOption.set(null);
  }
}
