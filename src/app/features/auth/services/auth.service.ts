import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { Credentials } from '../models/auth.model';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private state = inject(LedgerState);
  private router = inject(Router);
  login(credentials: Credentials, register: boolean) {
    return this.state.run(async () => {
      await this.api.request('/auth/' + (register ? 'register' : 'login'), credentials);
      await this.state.refresh();
      await this.router.navigateByUrl('/overview');
    });
  }
  logout() {
    return this.state.run(async () => {
      await this.api.request('/logout', {});
      this.state.reset();
      await this.router.navigateByUrl('/');
    });
  }
}
