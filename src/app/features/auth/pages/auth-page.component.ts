import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { AuthService } from '../services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, IconComponent, RouterLink],
  templateUrl: './auth-page.component.html',
  host: { class: 'block w-full min-h-[calc(100vh-120px)]' },
})
export class AuthPageComponent implements OnDestroy {
  vm = inject(LedgerState);
  auth = inject(AuthService);
  registering = signal(inject(ActivatedRoute).snapshot.routeConfig?.path === 'register');
  reveal = signal(false);
  code = '';
  now = signal(Date.now());
  waitSeconds = computed(() => Math.max(0, Math.ceil((this.auth.resendAt() - this.now()) / 1000)));
  private clock = setInterval(() => this.now.set(Date.now()), 1000);
  accepted=false;
  adult=false;
  email = '';
  password = '';
  confirmPassword = '';
  back() { this.auth.verification.set(null); this.code = ''; this.vm.error.set(''); }
  ngOnDestroy() { clearInterval(this.clock); this.auth.verification.set(null); }
  toggle() {
    this.back();
    this.registering.update((v) => !v);
    this.vm.error.set('');
    this.password = '';
    this.confirmPassword = '';
    this.reveal.set(false);
  }
  setMode(register: boolean) {
    if (this.registering() === register) return;
    this.toggle();
  }
  toggleReveal() {
    this.reveal.update((v) => !v);
  }
  async submit() {
    if (this.auth.verification()) { await this.auth.verify(this.code.trim()); return; }
    if (this.registering() && this.password !== this.confirmPassword) {
      this.vm.error.set('Las contraseñas no coinciden.');
      return;
    }
    await this.auth.login({ email: this.email, password: this.password, terms_accepted:this.accepted, age_confirmed:this.adult }, this.registering());
    if (this.vm.authenticated() || this.auth.verification()) {
      this.password = '';
      this.confirmPassword = '';
    }
  }
}
