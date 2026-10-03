import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent implements AfterViewInit {
  title = input.required<string>();
  message = input.required<string>();
  amount = input.required<string>();
  note = input('');
  confirmLabel = input('Confirmar registro');
  busy = input(false);
  error = input('');
  confirm = output();
  dismiss = output();
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
  }
}
