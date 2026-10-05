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
      import('./features/overview/pages/overview-page.component').then(
        (m) => m.OverviewPageComponent,
      ),
  },
  {
    path: 'bank',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/bank/pages/bank-page.component').then((m) => m.BankPageComponent),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/bets/pages/bets-page.component').then((m) => m.BetsPageComponent),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    data: { history: true },
    loadComponent: () =>
      import('./features/bets/pages/bets-page.component').then((m) => m.BetsPageComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    data: { settings: true },
    loadComponent: () =>
      import('./features/bank/pages/bank-page.component').then((m) => m.BankPageComponent),
  },
  {
    path: 'bets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/bets/pages/bets-page.component').then((m) => m.BetsPageComponent),
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
      import('./features/insights/pages/insights-page.component').then(
        (m) => m.InsightsPageComponent,
      ),
  },
  {
    path: 'challenges',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/challenges/pages/challenges-page.component').then(
        (m) => m.ChallengesPageComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
