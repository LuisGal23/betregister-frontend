import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  viewChild,
} from '@angular/core';
import { BankGuidanceComponent } from '../bank-guidance/bank-guidance.component';
@Component({
  selector: 'app-bank-guidance-dialog',
  imports: [BankGuidanceComponent],
  templateUrl: './bank-guidance-dialog.component.html',
  styleUrl: './bank-guidance-dialog.component.css',
})
export class BankGuidanceDialogComponent implements AfterViewInit, OnDestroy {
  houseId = input.required<string>();
  stake = input<number | null>(null);
  dismiss = output();
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private opener = document.activeElement as HTMLElement | null;
  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
  }
  ngOnDestroy() {
    this.dialog().nativeElement.close();
    if (this.opener?.isConnected) this.opener.focus();
  }
}
