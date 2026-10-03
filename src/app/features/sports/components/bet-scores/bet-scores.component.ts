import { AfterViewInit, Component, ElementRef, inject, input, OnDestroy, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SportsService } from '../../services/sports.service';
import type { BetScores } from '../../models/sports.model';
import { ScoreCardComponent } from '../score-card/score-card.component';
@Component({ selector:'app-bet-scores',imports:[FormsModule,ScoreCardComponent],templateUrl:'./bet-scores.component.html',styleUrl:'./bet-scores.component.css' })
export class BetScoresComponent implements AfterViewInit, OnDestroy {
  betId = input.required<number>();
  title = input.required<string>();
  dismiss = output();
  service = inject(SportsService);
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  result = signal<BetScores | null>(null);
  loading = signal(false);
  error = signal('');
  automatic = true;
  private timer?: ReturnType<typeof setTimeout>;
  private destroyed = false;
  private opener = document.activeElement as HTMLElement | null;
  ngAfterViewInit() { this.dialog().nativeElement.showModal(); void this.load(); }
  async load() {
    if (this.loading()) return;
    clearTimeout(this.timer); this.loading.set(true); this.error.set('');
    try { const result = await this.service.scores(this.betId()); if (!this.destroyed) this.result.set(result); }
    catch (error) { if (!this.destroyed) { this.result.set(null); this.error.set(error instanceof Error ? error.message : 'No se pudieron actualizar los marcadores.'); } }
    finally { if (!this.destroyed) { this.loading.set(false); this.schedule(); } }
  }
  schedule() {
    clearTimeout(this.timer);
    if (this.destroyed || !this.automatic) return;
    this.timer = setTimeout(() => { if (document.visibilityState === 'visible') void this.load(); else this.schedule(); }, (this.result()?.refresh_seconds ?? 60)*1000);
  }
  ngOnDestroy() { this.destroyed = true; clearTimeout(this.timer); this.dialog().nativeElement.close(); if (this.opener?.isConnected) this.opener.focus(); }
}
