import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ApiError, ApiService } from './api.service';
import { ExchangeRateService } from './exchange-rate.service';
import { emptyDashboard, type Dashboard } from '../models/dashboard.model';
import type { Currency } from '../../shared/models/currency.model';
import { convertMoney, profitSeries } from '../../shared/utils/ledger.utils';
import { withOptimisticState } from '../../shared/utils/optimistic.utils';

@Injectable({ providedIn: 'root' })
export class LedgerState {
  private api = inject(ApiService);
  private exchange = inject(ExchangeRateService);
  authenticated = signal(false);
  loading = signal(true);
  busy = signal(false);
  error = signal('', { equal: () => false });
  notice = signal('', { equal: () => false });
  private errorExpiry = effect((onCleanup) => {
    if (!this.error()) return;
    const timer = setTimeout(() => this.error.set(''), 5000);
    onCleanup(() => clearTimeout(timer));
  });
  private noticeExpiry = effect((onCleanup) => {
    if (!this.notice()) return;
    const timer = setTimeout(() => this.notice.set(''), 5000);
    onCleanup(() => clearTimeout(timer));
  });
  data = signal<Dashboard>(emptyDashboard());
  currency = computed(() => this.data().profile.display_currency);
  rateDate = this.exchange.rateDate;
  rateLoading = this.exchange.rateLoading;
  rateError = this.exchange.rateError;
  rate = computed(() =>
    this.data().profile.manual_rate
      ? Number(this.data().profile.manual_rate)
      : this.exchange.marketRate(),
  );
  rateSource = computed(() =>
    this.data().profile.manual_rate ? 'Tasa manual' : 'Referencia diaria · Frankfurter',
  );
  pendingMovements = computed(() => this.data().movements.filter((m) => m.status === 'pending'));
  pendingBets = computed(() => this.data().bets.filter((b) => b.status === 'pending'));
  activeBets = computed(() =>
    this.data().bets.filter((b) => this.data().houses.some((h) => h.id === b.house_id)),
  );
  won = computed(() => this.activeBets().filter((b) => b.status === 'won').length);
  lost = computed(() => this.activeBets().filter((b) => b.status === 'lost').length);
  winRate = computed(() =>
    this.won() + this.lost() ? (this.won() / (this.won() + this.lost())) * 100 : null,
  );
  series = computed(() => profitSeries(this.activeBets(), this.currency(), this.rate()));
  conversionMissing = computed(
    () => this.rate() === null && this.data().houses.some((h) => h.currency !== this.currency()),
  );
  labels: Record<string, string> = {
    deposit: 'Depósito',
    withdrawal: 'Retiro',
    bonus: 'Bono',
    fee: 'Comisión',
    tax: 'Impuesto',
    pending: 'Pendiente',
    won: 'Ganada',
    lost: 'Perdida',
    void: 'Anulada',
    cashout: 'Cashout',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
  };

  private initialization?: Promise<void>;
  init() {
    return (this.initialization ??= this.initialize());
  }
  private async initialize() {
    try {
      await this.refresh();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401))
        this.error.set('No se pudo cargar el registro. Revisa la conexión.');
    } finally {
      this.loading.set(false);
    }
    void this.loadRate();
  }
  reset() {
    this.authenticated.set(false);
    this.data.set(emptyDashboard());
  }
  async refresh() {
    this.data.set(await this.api.request<Dashboard>('/dashboard'));
    this.authenticated.set(true);
  }
  async run(work: () => Promise<void>): Promise<boolean> {
    if (this.busy()) return false;
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await work();
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) this.reset();
      this.error.set(error instanceof Error ? error.message : 'No se pudo conectar.');
      return false;
    } finally {
      this.busy.set(false);
    }
  }
  async mutate(
    work: () => Promise<unknown>,
    message: string,
    optimistic?: (value: Dashboard) => Dashboard,
  ) {
    return this.run(async () => {
      if (optimistic)
        await withOptimisticState(
          () => this.data(),
          (value) => this.data.set(value),
          optimistic,
          work,
        );
      else await work();
      await this.refresh();
      this.notice.set(message);
    });
  }
  rateManual() {
    const value = this.data().profile.manual_rate;
    return value ? Number(value) : null;
  }
  loadRate() {
    return this.exchange.loadRate();
  }
  converted(minor: number, source: Currency) {
    return convertMoney(minor, source, this.currency(), this.rate());
  }
  format(value: number | null, currency: Currency = this.currency()) {
    return value === null
      ? '—'
      : new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency,
          currencyDisplay: 'code',
          maximumFractionDigits: 2,
        }).format(value);
  }
  money(minor: number, source: Currency) {
    return this.format(this.converted(minor, source));
  }
  native(minor: number, source: Currency) {
    return this.format(minor / 100, source);
  }
  total(key: 'balance' | 'pending' | 'profit') {
    let sum = 0;
    for (const house of this.data().houses) {
      const value = this.converted(house[key], house.currency);
      if (value === null) return null;
      sum += value;
    }
    return sum;
  }
}
