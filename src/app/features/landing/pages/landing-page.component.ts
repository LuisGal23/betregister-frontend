import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LedgerState } from '../../../core/services/ledger-state.service';
@Component({
  selector: 'app-landing',
  imports: [RouterLink, IconComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent {
  vm = inject(LedgerState);
}
