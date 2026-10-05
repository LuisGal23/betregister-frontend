import { SmartSettingsComponent } from '../components/smart-settings/smart-settings.component';
import { UnitsService } from '../../../core/services/units.service';
import { ApiService } from '../../../core/services/api.service';
import { TransactionsPageComponent } from '../../transactions/pages/transactions-page.component';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ResetBankComponent } from '../components/reset-bank/reset-bank.component';
import { DatePipe, DecimalPipe } from '@angular/common';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ChartsComponent } from '../../overview/components/charts/charts.component';
import { BankService } from '../services/bank.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { House } from '../models/house.model';
import type { Currency } from '../../../shared/models/currency.model';
@Component({
  selector: 'app-bank-page',
  imports: [
    RouterLink, SmartSettingsComponent,
    TransactionsPageComponent,
    FormsModule,
    ResetBankComponent,
    DatePipe,
    DecimalPipe,
    IconComponent,
    ChartsComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './bank-page.component.html',
  styleUrl: './bank-page.component.css',
})
export class BankPageComponent {
  settingsOnly = !!inject(ActivatedRoute).snapshot.data['settings'];
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
    if (await this.bank.create({ name: this.houseName, currency: this.houseCurrency }))
      this.houseName = '';
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
