import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BankGuidanceComponent } from '../bank-guidance/bank-guidance.component';
import { fractionalKelly } from '../../../../shared/utils/kelly.utils';
@Component({
  selector: 'app-bank-assistant',
  imports: [FormsModule, IconComponent, BankGuidanceComponent],
  templateUrl: './bank-assistant.component.html',
  styleUrl: './bank-assistant.component.css',
})
export class BankAssistantComponent {
  vm = inject(LedgerState);
  houseId = input('');
  houseIdChange = output<string>();
  stake = input<number | null>(null);
  odds = input<number | null>(null);
  open = signal(false);
  mode = signal<'fixed' | 'kelly'>('fixed');
  probability = signal<number | null>(null);
  kellyOdds = signal<number | null>(null);
  fraction = signal(0.25);
  launcher = viewChild<ElementRef<HTMLButtonElement>>('launcher');
  closer = viewChild<ElementRef<HTMLButtonElement>>('closer');
  house = computed(() => this.vm.data().houses.find((h) => String(h.id) === this.houseId()));
  calculation = computed(() =>
    this.house()
      ? fractionalKelly(
          this.house()!.balance,
          this.kellyOdds(),
          this.probability(),
          this.fraction(),
        )
      : null,
  );
  risk = computed(
    () => !!this.house() && (this.stake() ?? 0) * 100 > Math.floor(this.house()!.balance / 50),
  );
  constructor() {
    effect(() => this.kellyOdds.set(this.odds()));
    effect(() => {
      if (this.open()) this.closer()?.nativeElement.focus();
    });
  }
  close() {
    this.open.set(false);
    this.launcher()?.nativeElement.focus();
  }
}
