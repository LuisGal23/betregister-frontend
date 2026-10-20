import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
interface Report {
  valid: boolean;
  rows: number;
  imported: number;
  errors: { line: number; message: string }[];
  dry_run: boolean;
}
@Component({
  selector: 'app-csv-transfer',
  templateUrl: './csv-transfer.component.html',
})
export class CsvTransferComponent {
  vm = inject(LedgerState);
  api = inject(ApiService);
  content = '';
  report = signal<Report | null>(null);
  fileName = signal('');
  localError = signal('');
  reading = signal(false);
  async choose(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.report.set(null);
    this.localError.set('');
    this.content = '';
    if (!file) return;
    this.fileName.set(file.name);
    if (file.size > 2_000_000) {
      this.localError.set('Máximo 2 MB por archivo.');
      return;
    }
    this.reading.set(true);
    try {
      this.content = await file.text();
    } catch {
      this.localError.set('No se pudo leer el archivo.');
    } finally {
      this.reading.set(false);
    }
  }
  async run(dry_run: boolean) {
    await this.vm.run(async () => {
      const report = await this.api.request<Report>('/import/bets', {
        content: this.content,
        dry_run,
      });
      this.report.set(report);
      if (report.imported) {
        await this.vm.refresh();
        this.vm.notice.set(`${report.imported} apuestas importadas.`);
      }
    });
  }
}
