import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  marketRate = signal<number | null>(null);
  rateDate = signal('');
  rateLoading = signal(false);
  rateError = signal('');
  async loadRate() {
    if (this.rateLoading()) return;
    this.rateLoading.set(true);
    this.rateError.set('');
    try {
      const response = await fetch('https://api.frankfurter.dev/v2/rate/USD/MXN', {
        credentials: 'omit',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (
        typeof result.rate !== 'number' ||
        !Number.isFinite(result.rate) ||
        result.rate <= 0 ||
        typeof result.date !== 'string'
      )
        throw new Error();
      this.marketRate.set(result.rate);
      this.rateDate.set(result.date);
    } catch {
      this.rateError.set(
        this.marketRate()
          ? 'No se pudo actualizar. Se conserva la referencia anterior.'
          : 'Referencia no disponible. Puedes ingresar un tipo de cambio manual.',
      );
    } finally {
      this.rateLoading.set(false);
    }
  }
}
