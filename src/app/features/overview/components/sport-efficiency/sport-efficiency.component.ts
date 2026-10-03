import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { sportEfficiency } from '../../models/sport-efficiency';
@Component({
  selector: 'app-sport-efficiency',
  imports: [RouterLink],
  templateUrl: './sport-efficiency.component.html',
  styleUrl: './sport-efficiency.component.css',
})
export class SportEfficiencyComponent {
  vm = inject(LedgerState);
  rows = computed(() => sportEfficiency(this.vm.activeBets()));
}
