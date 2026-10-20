import { Injectable, signal } from '@angular/core';
import type { SportsGame } from './sports.model';

@Injectable({ providedIn: 'root' })
export class CuotasStatsModalService {
  readonly isOpen = signal<boolean>(false);
  readonly game = signal<SportsGame | null>(null);
  readonly allGames = signal<SportsGame[]>([]);

  open(game: SportsGame, allGames: SportsGame[] = []) {
    this.game.set(game);
    this.allGames.set(allGames && allGames.length ? allGames : [game]);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.game.set(null);
  }

  setGame(game: SportsGame) {
    this.game.set(game);
  }
}
