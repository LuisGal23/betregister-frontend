import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { Challenge } from './challenge.model';
@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private api = inject(ApiService);
  items = signal<Challenge[]>([]);
  async load() {
    this.items.set((await this.api.request<{ challenges: Challenge[] }>('/challenges')).challenges);
  }
  async create(data: unknown) {
    await this.api.request('/challenges', data);
    await this.load();
  }
  async link(id: number, bet_id: number, linked = true) {
    await this.api.request('/challenges/' + id + '/bets', { bet_id, linked });
    await this.load();
  }
  async status(id: number, status: string) {
    await this.api.request('/challenges/' + id + '/status', { status });
    await this.load();
  }
}
