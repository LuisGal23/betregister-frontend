import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { ChallengesService } from '../../../desafios/services/challenges.service';

@Component({
  selector: 'app-reset-bank',
  imports: [FormsModule],
  templateUrl: './reset-bank.component.html',
  host: { class: 'block mt-6' },
})
export class ResetBankComponent {
  readonly vm = inject(LedgerState);
  private api = inject(ApiService);
  private challenges = inject(ChallengesService);
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  error = signal('');
  busy = signal(false);
  password = '';
  confirmation = '';
  open() {
    this.password = this.confirmation = '';
    this.error.set('');
    this.dialog().nativeElement.showModal();
  }
  close(event?: Event) {
    if (this.busy()) { event?.preventDefault(); return; }
    this.password = this.confirmation = '';
    this.dialog().nativeElement.close();
  }
  async reset() {
    if (this.busy() || this.confirmation !== 'EMPEZAR DE NUEVO') return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.request('/account/reset', { password: this.password, confirmation: this.confirmation });
      // Reload clears every cached chart, draft, selection and recommendation.
      this.challenges.items.set([]);
      window.location.assign('/bank');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo conectar.');
      this.busy.set(false);
    }
  }
}
