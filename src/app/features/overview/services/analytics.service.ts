import { matchesTags, LEAGUE_TAGS, MARKET_TAGS, SPORT_TAGS } from '../../bets/models/bet-tags';
import { Injectable, computed, inject, signal } from '@angular/core';
import { LedgerState } from '../../../core/services/ledger-state.service';
import { periodBounds, localDate, type Period } from '../../../shared/utils/period.utils';
import { calculateMetrics } from '../../../shared/utils/metrics.utils';
import { zoneDay, zoneMidnight, instant } from '../../../shared/utils/zone.utils';
import { eventSeries, type ProfitEvent } from '../../../shared/utils/event-series.utils';
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  vm = inject(LedgerState);
  period = signal<Period>('month');
  anchor = signal(zoneDay(new Date().toISOString(), this.vm.data().profile.timezone));
  includeArchived = signal(false);
  typeFilter = signal('');
  sportFilter = signal('');
  leagueFilter = signal('');
  marketFilter = signal('');
  leagueTags = LEAGUE_TAGS;
  marketTags = MARKET_TAGS;
  sportTags = SPORT_TAGS;
  hasTagFilter = computed(() => !!(this.sportFilter() || this.leagueFilter() || this.marketFilter() || this.typeFilter()));
  taggedBets = computed(() => {
    const ids = new Set(this.vm.data().houses.map(h => h.id));
    return this.vm.data().bets.filter(b => (this.includeArchived() || ids.has(b.house_id)) && (!this.typeFilter() || (b.bet_type ?? 'simple') === this.typeFilter()) && matchesTags(b, { sport:this.sportFilter(),league:this.leagueFilter(),market:this.marketFilter() }));
  });
  tabs: { value: Period; label: string }[] = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'all', label: 'Histórico' },
  ];
  day(value: string) {
    return zoneDay(value, this.vm.data().profile.timezone);
  }
  eventTime(time: number) {
    return new Intl.DateTimeFormat('es-MX', { timeZone: this.vm.data().profile.timezone ?? 'America/Mexico_City', dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23' }).format(new Date(time));
  }
  range() {
    const [start, end] = periodBounds(this.period(), this.anchor());
    return this.period() === 'all'
      ? ['0000-01-01', '9999-12-31']
      : [localDate(new Date(start)), localDate(new Date(end))];
  }
  activeEntries = computed(() => {
    const ids = new Set(this.taggedBets().map(b => b.id));
    return (this.vm.data().ledger ?? []).filter(e => (this.includeArchived() || !e.archived) && (!this.hasTagFilter() || (['bet_stake','settlement','partial_cashout','correction'].includes(e.kind) && ids.has(e.source_id ?? -1))));
  });
  bets = computed(() => {
    const ids = new Set(this.vm.data().houses.map((h) => h.id));
    const [start, end] = this.range();
    return this.taggedBets().filter((b) => {
      const date = this.day(b.settled_at || b.created);
      return (
        (this.includeArchived() || ids.has(b.house_id)) &&
        b.status !== 'pending' &&
        date >= start &&
        date < end
      );
    });
  });
  series = computed(() => {
    const [start, end] = this.range();
    const events: ProfitEvent[] = [];
    const tickets = new Map(this.vm.data().bets.map(b => [b.id, b]));
    for (const e of this.activeEntries()) {
      const date = this.day(e.created);
      if (date < start || date >= end || !['settlement', 'partial_cashout', 'correction'].includes(e.kind)) continue;
      const amount = this.vm.converted(e.profit, e.currency);
      if (amount === null) return null;
      const ticket = tickets.get(e.source_id ?? -1);
      const kind = e.kind === 'partial_cashout' ? 'Cashout parcial' : e.kind === 'correction' ? 'Corrección' : ticket?.status === 'cashout' ? 'Cashout' : amount > 0 ? 'Ganada' : amount < 0 ? 'Perdida' : 'Sin ganancia ni pérdida';
      events.push({ id: e.id, time: instant(e.created), profit: amount, label: kind + (ticket ? ' · ' + ticket.event : '') });
    }
    const zone = this.vm.data().profile.timezone;
    const today = this.day(new Date().toISOString());
    const first = this.period() === 'all' ? (events.length ? this.day(new Date(Math.min(...events.map(e => e.time))).toISOString()) : today).slice(0, 7) + '-01' : start;
    return eventSeries(events, zoneMidnight(first, zone), Math.min(Date.now(), this.period() === 'all' ? Infinity : zoneMidnight(end, zone) - 1));
  });

  metrics = computed(() => {
    const converted = this.activeEntries().map((e) => ({
      ...e,
      amount: this.vm.converted(e.amount, e.currency),
      profit: this.vm.converted(e.profit, e.currency),
      cost: this.vm.converted(e.cost, e.currency),
    }));
    if (converted.some((e) => e.amount === null || e.profit === null || e.cost === null))
      return null;
    const ids = new Set(this.vm.data().houses.map((h) => h.id));
    const closed = this.taggedBets().filter(
        (b) =>
          b.status !== 'pending' &&
          b.status !== 'void' &&
          (this.includeArchived() || ids.has(b.house_id)),
      )
      .map((b) => ({
        id: b.id,
        date: b.settled_at || b.created,
        profit: this.vm.converted(b.payout - b.stake, b.currency) ?? 0,
      }));
    const values = this.taggedBets().map(b => this.vm.converted(b.stake,b.currency));
    if (values.some(v => v === null)) return null;
    const totalStaked = values.reduce<number>((sum,v) => sum + v!,0);
    const metrics = calculateMetrics(converted.map(e => ({ ...e, amount:e.amount!,profit:e.profit!,cost:e.cost! })),closed);
    const tickets = this.taggedBets();
    return { ...metrics, totalStaked, yieldTotal:totalStaked > 0 ? metrics.profit / totalStaked * 100 : null,
      averageOdds:tickets.length ? tickets.reduce((sum,b) => sum + Number(b.odds),0)/tickets.length : null };

  });
  profit = computed(() => this.series()?.at(-1)?.value ?? (this.series() === null ? null : 0));
  won = computed(() => this.bets().filter((b) => b.status === 'won').length);
  lost = computed(() => this.bets().filter((b) => b.status === 'lost').length);
  winRate = computed(() =>
    this.won() + this.lost() ? (this.won() / (this.won() + this.lost())) * 100 : null,
  );
  setAnchor(value: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) this.anchor.set(value);
  }
}
