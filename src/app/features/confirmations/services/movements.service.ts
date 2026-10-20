import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { CreateMovement } from './movement.model';
@Injectable({ providedIn: 'root' })
export class MovementsService {
  private api = inject(ApiService);
  private state = inject(LedgerState);
  create({ house_id, ...data }: CreateMovement) {
    return this.state.mutate(
      () => this.api.request(`/houses/${house_id}/movements`, data),
      'Movimiento registrado. Confírmalo cuando se refleje en la casa.',
    );
  }
  decide(id: number, action: 'confirm' | 'cancel') {
    return this.state.mutate(
      () => this.api.request(`/movements/${id}/decision`, { action }),
      action === 'confirm' ? 'Movimiento confirmado.' : 'Movimiento cancelado.',
    );
  }
}
