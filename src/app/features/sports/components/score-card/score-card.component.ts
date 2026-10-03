import { Component, inject, input } from '@angular/core';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import type { SportsGame } from '../../models/sports.model';
@Component({
  selector: 'app-score-card',
  templateUrl: './score-card.component.html',
  styleUrl: './score-card.component.css',
})
export class ScoreCardComponent {
  game = input.required<SportsGame>();
  failed = new Set<string>();
  logoFailed(url: string) { this.failed.add(url); }
  initials(name: string) { return name.split(' ').map(word => word[0]).slice(0,2).join(''); }
  vm = inject(LedgerState);
  states = { scheduled: 'Programado', live: 'En juego', final: 'Finalizado', postponed: 'Aplazado / interrumpido', unknown: 'Sin datos' };
  time(value: string) {
    return new Intl.DateTimeFormat('es-MX', { timeZone: this.vm.data().profile.timezone ?? 'America/Mexico_City', day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).format(new Date(value));
  }
}
