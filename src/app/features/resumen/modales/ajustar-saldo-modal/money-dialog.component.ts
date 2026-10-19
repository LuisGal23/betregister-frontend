import {
  AfterViewInit,
  OnInit,
  OnDestroy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ConfirmationsPageComponent } from '../../../confirmations/pages/confirmations-page.component';
import { TransactionsPageComponent } from '../../../transactions/pages/transactions-page.component';
import { LedgerState } from '../../../../core/services/ledger-state.service';
@Component({
  selector: 'app-money-dialog',
  imports: [ConfirmationsPageComponent, TransactionsPageComponent],
  templateUrl: './money-dialog.component.html',
})
export class MoneyDialogComponent implements AfterViewInit, OnInit, OnDestroy {
  initial = input('new');
  dismiss = output();
  vm = inject(LedgerState);
  tab = signal('new');
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private opener = document.activeElement as HTMLElement | null;
  ngOnInit() {
    this.tab.set(this.initial());
  }
  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
  }
  ngOnDestroy() {
    this.dialog().nativeElement.close();
    if (this.opener?.isConnected) this.opener.focus();
  }
}
