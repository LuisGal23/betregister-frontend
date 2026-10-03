import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LedgerState } from '../services/ledger-state.service';

export const authGuard: CanActivateFn = async () => {
  const state = inject(LedgerState), router = inject(Router);
  await state.init();
  return state.authenticated() || router.createUrlTree(['/login']);
};
