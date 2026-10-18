import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LedgerState } from '../../../core/services/ledger-state.service';

export interface SportAuditExample {
  sport: string;
  badge: string;
  awayTeam: string;
  awayProb: number;
  homeTeam: string;
  homeProb: number;
  calibrationLabel: string;
  calibrationStat: string;
  calibrationYield: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink, IconComponent],
  templateUrl: './landing-page.component.html',
  host: { class: 'block w-full' },
})
export class LandingPageComponent {
  vm = inject(LedgerState);
  activeSport = signal<'NFL' | 'MLB' | 'Fútbol'>('NFL');

  examples: Record<'NFL' | 'MLB' | 'Fútbol', SportAuditExample> = {
    NFL: {
      sport: 'NFL',
      badge: 'NFL · DOM 19:30',
      awayTeam: 'Texans',
      awayProb: 43,
      homeTeam: 'Jaguars',
      homeProb: 57,
      calibrationLabel: 'En la NFL, esta temporada:',
      calibrationStat: '9 de 15 favoritos acertados (60%)',
      calibrationYield: '+18.4% ROI',
    },
    MLB: {
      sport: 'MLB',
      badge: 'MLB · HOY 19:05',
      awayTeam: 'Yankees',
      awayProb: 54,
      homeTeam: 'Red Sox',
      homeProb: 46,
      calibrationLabel: 'En la MLB, esta temporada:',
      calibrationStat: '18 de 25 pronósticos acertados (72%)',
      calibrationYield: '+24.1% ROI',
    },
    Fútbol: {
      sport: 'Fútbol',
      badge: 'LALIGA · SÁB 14:00',
      awayTeam: 'Barcelona',
      awayProb: 48,
      homeTeam: 'Real Madrid',
      homeProb: 52,
      calibrationLabel: 'En fútbol europeo, esta temporada:',
      calibrationStat: '22 de 30 selecciones acertadas (73%)',
      calibrationYield: '+16.8% ROI',
    },
  };

  currentExample() {
    return this.examples[this.activeSport()];
  }
}
