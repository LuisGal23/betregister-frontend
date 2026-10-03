import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { AuthService } from '../services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, IconComponent],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.css',
})
export class AuthPageComponent {
  vm = inject(LedgerState);
  auth = inject(AuthService);
  registering = signal(inject(ActivatedRoute).snapshot.routeConfig?.path === 'register');
  reveal = signal(false);
  email = '';
  password = '';
  confirmPassword = '';
  toggle() {
    this.registering.update((v) => !v);
    this.vm.error.set('');
    this.password = '';
    this.confirmPassword = '';
    this.reveal.set(false);
  }
  toggleReveal() {
    this.reveal.update((v) => !v);
  }
  async submit() {
    if (this.registering() && this.password !== this.confirmPassword) {
      this.vm.error.set('Las contraseñas no coinciden.');
      return;
    }
    await this.auth.login({ email: this.email, password: this.password }, this.registering());
    if (this.vm.authenticated()) {
      this.password = '';
      this.confirmPassword = '';
    }
  }
}
