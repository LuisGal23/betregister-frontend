import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { LedgerState } from '../../../core/services/ledger-state.service';
import type { CreateHouse } from './house.model';
import type { Currency } from '../../../shared/models/currency.model';
@Injectable({ providedIn: 'root' })
export class BankService {
  private api = inject(ApiService);
  private state = inject(LedgerState);
  archive(id: number) {
    return this.state.mutate(
      () => this.api.request(`/houses/${id}/archive`, {}),
      'Casa eliminada del bank activo. Su historial se conserva.',
    );
  }
  create(data: CreateHouse) {
    return this.state.mutate(
      () => this.api.request('/houses', data),
      'Casa añadida. Registra y confirma su depósito inicial.',
    );
  }
  savePreferences(
    currency: Currency,
    manualRate: number | null = this.state.rateManual(),
    timezone: string = this.state.data().profile.timezone ?? 'America/Mexico_City',
  ) {
    return this.state.mutate(
      () =>
        this.api.request('/preferences', {
          display_currency: currency,
          manual_rate: manualRate,
          timezone,
        }),
      'Preferencias guardadas.',
    );
  }
}
