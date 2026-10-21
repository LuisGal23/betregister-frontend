import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  ...[['terms','terms'],['privacy','privacy'],['delete-account','delete'],['support','support']].map(([path,kind])=>({path,data:{kind},loadComponent:()=>import('./features/legal/legal-page.component').then(m=>m.LegalPageComponent)})),
  {path:'p/:token',loadComponent:()=>import('./features/public-record/public-record.component').then(m=>m.PublicRecordComponent)},
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/pages/landing-page.component').then((m) => m.LandingPageComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/auth-page.component').then((m) => m.AuthPageComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/auth-page.component').then((m) => m.AuthPageComponent),
  },
  {
    path: 'overview',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/resumen/pages/overview-page.component').then(
        (m) => m.OverviewPageComponent,
      ),
  },
  {
    path: 'matches',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/partidos/pages/matches-page/matches-page.component').then(
        (m) => m.MatchesPageComponent,
      ),
  },
  {
    path: 'pronosticos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pronosticos/pages/pronosticos-page.component').then(
        (m) => m.PronosticosPageComponent,
      ),
  },
  {
    path: 'pronosticos/:matchId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pronosticos/pages/pronosticos-page.component').then(
        (m) => m.PronosticosPageComponent,
      ),
  },
  {
    path: 'ia',
    redirectTo: 'pronosticos',
  },
  {
    path: 'challenges',
    redirectTo: 'pronosticos',
  },
  {
    path: 'retos',
    redirectTo: 'pronosticos',
  },
  {
    path: 'match-analysis',
    redirectTo: 'matches',
  },
  {
    path: 'cuotas',
    redirectTo: 'matches',
  },
  {
    path: 'odds',
    redirectTo: 'matches',
  },
  {
    path: 'estadisticas',
    redirectTo: 'matches',
  },
  {
    path: 'partidos/:league/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/partidos/pages/match-detail-page/match-detail-page.component').then(
        (m) => m.MatchDetailPageComponent
      ),
  },
  {
    path: 'matches/:league/:id',
    redirectTo: 'partidos/:league/:id',
  },
  {
    path: 'partidos',
    redirectTo: 'matches',
  },
  {
    path: 'bank',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/banco/pages/bank-page.component').then((m) => m.BankPageComponent),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/apuestas/pages/bets-page.component').then((m) => m.BetsPageComponent),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    data: { history: true },
    loadComponent: () =>
      import('./features/apuestas/pages/bets-page.component').then((m) => m.BetsPageComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    data: { settings: true },
    loadComponent: () =>
      import('./features/banco/pages/bank-page.component').then((m) => m.BankPageComponent),
  },
  {
    path: 'bets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/apuestas/pages/bets-page.component').then((m) => m.BetsPageComponent),
  },
  {
    path: 'transactions',
    redirectTo: ({ queryParams }) =>
      inject(Router).createUrlTree(['/overview'], {
        queryParams: { ...queryParams, movements: 'history' },
      }),
  },
  {
    path: 'confirmations',
    redirectTo: ({ queryParams }) =>
      inject(Router).createUrlTree(['/overview'], {
        queryParams: { ...queryParams, movements: 'new' },
      }),
  },
  {
    path: 'insights',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/rentabilidad/pages/insights-page.component').then(
        (m) => m.InsightsPageComponent,
      ),
  },
  {
    path: 'community',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comunidad/pages/community-page/community-page.component').then(
        (m) => m.CommunityPageComponent,
      ),
  },
  {
    path: 'tipsters',
    redirectTo: 'community',
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/perfil/pages/profile-page/profile-page.component').then(
        (m) => m.ProfilePageComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
