import {
  AfterViewInit,
  OnDestroy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { timestamp } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-detail-card',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './detail-card.component.html',
  styleUrl: './detail-card.component.css',
})
export class DetailCardComponent implements AfterViewInit, OnDestroy {
  private opener = document.activeElement as HTMLElement | null;
  kind = input.required<'bank' | 'bets'>();
  dismiss = output();
  vm = inject(LedgerState);
  limit = signal(5);
  timestamp = timestamp;
  recent = computed(() =>
    [...this.vm.data().bets]
      .filter((b) => !b.history_hidden)
      .sort(
        (a, b) =>
          new Date(timestamp(b.created)).getTime() - new Date(timestamp(a.created)).getTime() ||
          b.id - a.id,
      )
      .slice(0, this.limit()),
  );
  total = computed(() => {
    const balance = this.vm.total('balance'),
      pending = this.vm.total('pending');
    return balance === null || pending === null ? null : balance + pending;
  });
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
  }
  ngOnDestroy() {
    this.dialog().nativeElement.close();
    if (this.opener?.isConnected) this.opener.focus();
  }
  backdrop(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) this.dismiss.emit();
  }
}
