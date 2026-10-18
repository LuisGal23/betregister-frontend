import { Injectable, signal } from '@angular/core';
import type { GameReference } from '../../sports/models/sports.model';

@Injectable({ providedIn: 'root' })
export class TicketModalService {
  readonly isOpen = signal(false);
  readonly initialGame = signal<GameReference | null>(null);

  open(game?: GameReference | null) {
    this.initialGame.set(game ?? null);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.initialGame.set(null);
  }
}
