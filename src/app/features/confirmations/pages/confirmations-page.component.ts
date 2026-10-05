import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

import { signal } from '@angular/core';
import { MovementsService } from '../services/movements.service';
import type { Movement, MovementKind } from '../models/movement.model';
import type { Review } from '../../../shared/models/review.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { timestamp } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-confirmations-page',
  imports: [RouterLink, FormsModule, DatePipe, IconComponent, ConfirmDialogComponent],
  templateUrl: './confirmations-page.component.html',
  styleUrl: './confirmations-page.component.css',
})
export class ConfirmationsPageComponent {
  vm = inject(LedgerState);
  readonly Math = Math;

  movements = inject(MovementsService);
  private params = inject(ActivatedRoute).snapshot.queryParamMap;
  selectedHouse = this.params.get('house') ?? '';
  amount: number | null = null;
  kind: MovementKind = this.params.get('kind') === 'withdrawal' ? 'withdrawal' : 'deposit';
  review = signal<Review | null>(null);
  timestamp = timestamp;
  inputCurrency() {
    return (
      this.vm.data().houses.find((h) => String(h.id) === this.selectedHouse)?.currency ?? 'MXN'
    );
  }
  async addMovement() {
    if (this.amount === null) return;
    if (
      await this.movements.create({
        house_id: Number(this.selectedHouse),
        amount: this.amount,
        kind: this.kind,
      })
    )
      this.amount = null;
  }
  reviewMovement(m: Movement) {
    this.vm.error.set('');
    this.review.set({
      title: 'Confirmar ' + this.vm.labels[m.kind].toLowerCase(),
      message: `${m.house} · ${m.amount > 0 ? 'El importe se sumará a' : 'El importe se descontará de'} tu saldo.`,
      amount: this.vm.native(Math.abs(m.amount), m.currency),
      note: 'Confirma cuando se refleje en la casa de apuestas. Este registro no transfiere dinero.',
      execute: () => this.movements.decide(m.id, 'confirm'),
    });
  }
  async confirmReview() {
    const review = this.review();
    if (review && (await review.execute())) this.review.set(null);
  }
}
