import { Injectable, signal } from '@angular/core';
import type { GameReference } from '../../sports/models/sports.model';

export interface InitialBetOption {
  game?: GameReference | null;
  odds?: number | null;
  market?: string | null;
  pick?: string | null;
  line?: number | null;
  description?: string | null;
  eventLabel?: string | null;
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
      this.initialGame.set(opt.game ?? null);
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
