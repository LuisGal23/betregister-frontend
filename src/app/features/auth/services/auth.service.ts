import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { Credentials } from '../models/auth.model';
@Injectable({ providedIn: 'root' })
export class AuthService {
  verification = signal<{challenge: string; expires_in: number; resend_after: number} | null>(null);
  resendAt = signal(0);
  private api = inject(ApiService);
  private state = inject(LedgerState);
  private router = inject(Router);
  login(credentials: Credentials, register: boolean) {
    return this.state.run(async () => {
      const result = await this.api.request<{verification_required?: boolean; challenge: string; expires_in: number; resend_after: number}>('/auth/' + (register ? 'register' : 'login'), credentials, 60000);
      if (result.verification_required) {
        this.verification.set(result);
        this.resendAt.set(Date.now() + result.resend_after * 1000);
        return;
      }
      await this.complete();
    });
  }
  verify(code: string) {
    return this.state.run(async () => {
      await this.api.request('/email/confirm', { challenge: this.verification()?.challenge, code });
      await this.complete();
    });
  }
  resend() {
    if (Date.now() < this.resendAt()) return;
    return this.state.run(async () => {
      const result = await this.api.request<{challenge: string; expires_in: number; resend_after: number}>('/email/resend', { challenge: this.verification()?.challenge }, 60000);
      this.verification.set(result);
      this.resendAt.set(Date.now() + result.resend_after * 1000);
      this.state.notice.set('Enviamos un código nuevo. Usa el correo más reciente.');
    });
  }
  private async complete() {
    this.verification.set(null);
    await this.state.refresh();
    await this.router.navigateByUrl('/overview');
  }
  logout() {
    return this.state.run(async () => {
      await this.api.request('/logout', {});
      this.state.reset();
      await this.router.navigateByUrl('/');
    });
  }
}
