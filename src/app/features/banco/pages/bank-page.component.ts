import { SmartSettingsComponent } from '../components/smart-settings/smart-settings.component';
import { UnitsService } from '../../../core/services/units.service';
import { ApiService } from '../../../core/services/api.service';
import { TransactionsPageComponent } from '../../transactions/pages/transactions-page.component';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ResetBankComponent } from '../modales/reiniciar-bank-modal/reset-bank.component';
import { DatePipe, DecimalPipe } from '@angular/common';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BankService } from '../services/bank.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { House } from '../services/house.model';
import type { Currency } from '../../../shared/models/currency.model';

@Component({
  selector: 'app-bank-page',
  imports: [
    RouterLink,
    SmartSettingsComponent,
    TransactionsPageComponent,
    FormsModule,
    ResetBankComponent,
    DatePipe,
    DecimalPipe,
    IconComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './bank-page.component.html',
  host: { class: 'block space-y-6' },
})
export class BankPageComponent {
  private route = inject(ActivatedRoute);
  settingsOnly = !!this.route.snapshot.data['settings'];
  transactions = inject(TransactionsService);

  activeTab = signal<'houses' | 'units' | 'movements'>(
    (this.route.snapshot.queryParams['tab'] as 'houses' | 'units' | 'movements') || 'houses',
  );
  showAddHouse = signal(false);

  // Donut chart computation for houses bankroll distribution
  houseSlices = computed(() => {
    const houses = this.vm.data().houses;
    const total = houses.reduce((s, h) => s + (this.vm.converted(h.balance, h.currency) ?? 0), 0);
    if (total <= 0) return [];
    const colors = ['#29b8f5', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];
    let currentPct = 0;
    return houses.map((h, i) => {
      const val = this.vm.converted(h.balance, h.currency) ?? 0;
      const pct = (val / total) * 100;
      const start = currentPct;
      const end = currentPct + pct;
      currentPct = end;
      return {
        id: h.id,
        name: h.name,
        currency: h.currency,
        balance: h.balance,
        converted: val,
        percentage: Math.round(pct * 10) / 10,
        color: colors[i % colors.length],
        start,
        end,
      };
    });
  });

  houseDonutGradient = computed(() => {
    const slices = this.houseSlices();
    if (!slices.length) return 'var(--surface-high)';
    const parts = slices.map((s) => `${s.color} ${s.start}% ${s.end}%`);
    return `conic-gradient(${parts.join(', ')})`;
  });

  // Donut chart computation for movements (Deposits vs Withdrawals)
  movementSlices = computed(() => {
    const deposits = this.transactions.confirmedTotal('deposit') ?? 0;
    const withdrawals = this.transactions.confirmedTotal('withdrawal') ?? 0;
    const total = deposits + withdrawals;
    if (total <= 0) {
      return {
        depositsPct: 50,
        withdrawalsPct: 50,
        hasData: false,
        deposits,
        withdrawals,
        total,
        netFlow: deposits - withdrawals,
        gradient: 'conic-gradient(var(--border) 0% 100%)',
      };
    }
    const depositsPct = Math.round((deposits / total) * 1000) / 10;
    const withdrawalsPct = Math.round((withdrawals / total) * 1000) / 10;
    return {
      depositsPct,
      withdrawalsPct,
      hasData: true,
      deposits,
      withdrawals,
      total,
      netFlow: deposits - withdrawals,
      gradient: `conic-gradient(#10b981 0% ${depositsPct}%, #29b8f5 ${depositsPct}% 100%)`,
    };
  });
  movementTotal(house: number, kind: string) {
    return this.vm
      .data()
      .movements.filter((m) => m.house_id === house && m.kind === kind && m.status === 'confirmed')
      .reduce((s, m) => s + Math.abs(m.amount), 0);
  }
  vm = inject(LedgerState);
  readonly Math = Math;
  units = inject(UnitsService);
  api = inject(ApiService);
  unitMode = this.vm.data().profile.units?.mode ?? 'fixed';
  unitValue = Number(this.vm.data().profile.units?.value ?? 100);
  unitCurrency = this.vm.data().profile.units?.currency ?? this.vm.currency();
  unitDynamic = this.vm.data().profile.units?.dynamic ?? false;
  saveUnits() {
    return this.vm.mutate(
      () =>
        this.api.request('/preferences/units', {
          mode: this.unitMode,
          value: this.unitValue,
          currency: this.unitCurrency,
          dynamic: this.unitDynamic,
        }),
      'Unidad guardada.',
    );
  }

  private bank = inject(BankService);
  removal = signal<House | null>(null);
  canRemove(h: House) {
    return (
      h.balance === 0 &&
      h.pending === 0 &&
      !this.vm.pendingMovements().some((m) => m.house_id === h.id)
    );
  }
  async removeHouse() {
    const h = this.removal();
    if (h && (await this.bank.archive(h.id))) this.removal.set(null);
  }
  timezone = this.vm.data().profile.timezone ?? 'America/Mexico_City';
  async saveTimezone() {
    await this.bank.savePreferences(this.vm.currency(), this.vm.rateManual(), this.timezone);
  }
  houseName = '';
  houseCurrency: Currency = 'MXN';
  manualRate: number | null = this.vm.rateManual();
  async addHouse() {
    if (!this.houseName.trim()) return;
    if (await this.bank.create({ name: this.houseName.trim(), currency: this.houseCurrency })) {
      this.houseName = '';
      this.showAddHouse.set(false);
    }
  }
  async saveRate() {
    await this.bank.savePreferences(this.vm.currency(), this.manualRate);
  }
  async useAutomatic() {
    if (await this.bank.savePreferences(this.vm.currency(), null)) {
      this.manualRate = null;
      void this.vm.loadRate();
    }
  }
}
