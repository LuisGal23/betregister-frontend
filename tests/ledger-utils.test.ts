import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertMoney,
  lineGeometry,
  profitSeries,
  winningPayout,
} from '../src/app/shared/utils/ledger.utils.ts';
import type { Bet } from '../src/app/features/bets/models/bet.model.ts';
import { stakeRisk } from '../src/app/shared/utils/risk.utils.ts';
import { calculateMetrics } from '../src/app/shared/utils/metrics.utils.ts';
import { zoneDay } from '../src/app/shared/utils/zone.utils.ts';
import { withOptimisticState } from '../src/app/shared/utils/optimistic.utils.ts';
import { eventSeries } from '../src/app/shared/utils/event-series.utils.ts';
import { zoneMidnight } from '../src/app/shared/utils/zone.utils.ts';
import { americanPayout, decimalOdds } from '../src/app/shared/utils/odds.utils.ts';
import { matchesTags } from '../src/app/features/bets/models/bet-tags.ts';

test('American odds convert for display but returns use exact ratios', () => {
  assert.equal(decimalOdds(-110,'american'),1.9091);
  assert.equal(decimalOdds(150,'american'),2.5);
  assert.equal(decimalOdds(-99,'american'),null);
  assert.equal(decimalOdds(99,'american'),null);
  assert.equal(decimalOdds(-110.5,'american'),null);
  assert.equal(americanPayout(10000,-110),19091);
  assert.equal(americanPayout(1000000,-110),1909091);
  assert.equal(americanPayout(10000,150),25000);
});

test('sport league and market filters intersect without misclassifying old records', () => {
  const bet = {sport_tag:'Béisbol',league_tag:'MLB',market_tag:'Over'};
  assert.equal(matchesTags(bet,{sport:'Béisbol',league:'MLB',market:'Over'}),true);
  assert.equal(matchesTags(bet,{sport:'Fútbol',league:'MLB',market:''}),false);
  assert.equal(matchesTags(bet,{sport:'',league:'MLB',market:'Under'}),false);
  assert.equal(matchesTags({}, {sport:'',league:'Sin clasificar',market:''}),true);
});

test('intraday results preserve peaks even when the daily net is zero', () => {
  const series = eventSeries([
    { id: 2, time: 2000, profit: -100, label: 'Perdida' },
    { id: 1, time: 1000, profit: 100, label: 'Ganada' },
    { id: 3, time: 2000, profit: -20, label: 'Cashout parcial' },
  ], 0, 3000);
  assert.deepEqual(series.filter(p => p.event).map(p => p.value), [100, 0, -20]);
  assert.deepEqual(series.filter(p => p.event).map(p => p.change), [100, -100, -20]);
  assert.equal(series[1].value, 0);
  assert.equal(series.at(-1)?.value, -20);
  assert.equal(new Set(series.map(p => p.id)).size, series.length);
});

test('empty periods remain zero and results outside the period are excluded', () => {
  assert.deepEqual(eventSeries([], 0, 5000).map(p => p.value), [0,0]);
  assert.deepEqual(eventSeries([{id: 1, time: 6000, profit: 100, label: 'Ganada'}], 0, 5000).map(p => p.value), [0,0]);
  assert.deepEqual(eventSeries([], 6000, 5000), []);
});

test('day starts at midnight in the profile zone, including daylight saving dates', () => {
  assert.equal(new Date(zoneMidnight('2026-01-31', 'America/Mexico_City')).toISOString(), '2026-01-31T06:00:00.000Z');
  assert.equal(zoneMidnight('2026-03-09', 'America/New_York')-zoneMidnight('2026-03-08', 'America/New_York'), 23*3600000);
});

test('stake risk boundaries and missing balance are explicit', () => {
  assert.equal(stakeRisk(2, 100).level, 'Bajo');
  assert.equal(stakeRisk(5, 100).level, 'Moderado');
  assert.equal(stakeRisk(10, 100).level, 'Alto');
  assert.equal(stakeRisk(10.01, 100).level, 'Extremo');
  assert.equal(stakeRisk(1, 0).percent, null);
});
test('a rejected optimistic update restores the original state', async () => {
  let state = { balance: 100 };
  await assert.rejects(
    withOptimisticState(
      () => state,
      (value) => (state = value),
      (value) => ({ balance: value.balance - 70 }),
      async () => {
        assert.equal(state.balance, 30);
        throw new Error('409');
      },
    ),
  );
  assert.equal(state.balance, 100);
});
test('Mexico monthly aggregation keeps late January in January', () => {
  assert.equal(zoneDay('2026-02-01 05:30:00', 'America/Mexico_City'), '2026-01-31');
  assert.equal(zoneDay('2026-02-01 06:30:00', 'America/Mexico_City'), '2026-02-01');
});
test('metrics exclude deposits and withdrawals from profit and track underwater periods', () => {
  const m = calculateMetrics(
    [
      { id: 1, created: '2026-01-01', amount: 1000, profit: 0, cost: 0, kind: 'deposit' },
      { id: 2, created: '2026-01-02', amount: 200, profit: 100, cost: 100, kind: 'settlement' },
      { id: 3, created: '2026-01-03', amount: 0, profit: -200, cost: 200, kind: 'settlement' },
      { id: 4, created: '2026-01-04', amount: -500, profit: 0, cost: 0, kind: 'withdrawal' },
    ],
    [
      { id: 1, date: '2026-01-02', profit: 100 },
      { id: 2, date: '2026-01-03', profit: -200 },
    ],
  );
  assert.equal(m.profit, -100);
  assert.equal(m.roi, -10);
  assert.equal(m.maxDrawdown, 200);
  assert.equal(m.maxLossStreak, 1);
  assert.equal(m.lossesSince, '2026-01-03');
});
import { fillDailySeries } from '../src/app/shared/utils/chart-series.utils.ts';

test('daily chart starts at zero and carries profit through days without activity', () => {
  assert.deepEqual(
    fillDailySeries(
      [
        { date: '2026-09-03', value: 90 },
        { date: '2026-09-05', value: -10 },
      ],
      new Date(2026, 8, 1).getTime(),
      new Date(2026, 8, 7).getTime(),
    ),
    [
      { date: '2026-09-01', value: 0 },
      { date: '2026-09-02', value: 0 },
      { date: '2026-09-03', value: 90 },
      { date: '2026-09-04', value: 90 },
      { date: '2026-09-05', value: -10 },
      { date: '2026-09-06', value: -10 },
    ],
  );
});
test('empty days remain zero while a missing exchange rate stays unavailable', () => {
  const start = new Date(2026, 8, 1).getTime(),
    end = new Date(2026, 8, 3).getTime();
  assert.deepEqual(fillDailySeries([], start, end), [
    { date: '2026-09-01', value: 0 },
    { date: '2026-09-02', value: 0 },
  ]);
  assert.equal(fillDailySeries(null, start, end), null);
  assert.deepEqual(fillDailySeries([], end, start), []);
});
import { periodBounds } from '../src/app/shared/utils/period.utils.ts';

test('calendar periods include the selected day and use exclusive next-period boundaries', () => {
  const [day, next] = periodBounds('day', '2026-09-30');
  assert.equal(day, new Date(2026, 8, 30).getTime());
  assert.equal(next, new Date(2026, 9, 1).getTime());
  assert.deepEqual(periodBounds('week', '2026-09-30'), [
    new Date(2026, 8, 28).getTime(),
    new Date(2026, 9, 5).getTime(),
  ]);
  assert.deepEqual(periodBounds('month', '2026-12-31'), [
    new Date(2026, 11, 1).getTime(),
    new Date(2027, 0, 1).getTime(),
  ]);
  assert.deepEqual(periodBounds('all', '2026-09-30'), [-Infinity, Infinity]);
});

test('currency conversion respects original minor units and both directions', () => {
  assert.equal(convertMoney(10000, 'USD', 'MXN', 20), 2000);
  assert.equal(convertMoney(200000, 'MXN', 'USD', 20), 100);
  assert.equal(convertMoney(10000, 'MXN', 'MXN', null), 100);
  assert.equal(convertMoney(-1000, 'USD', 'MXN', 20), -200);
});
test('missing or invalid rate cannot produce a fake mixed-currency total', () => {
  for (const rate of [null, 0, -1, NaN, Infinity])
    assert.equal(convertMoney(10000, 'USD', 'MXN', rate), null);
});
test('profit chart groups settlement dates and excludes pending stakes', () => {
  const bets = [
    {
      status: 'won',
      currency: 'MXN',
      stake: 10000,
      payout: 19000,
      settled_at: '2026-09-02 12:00:00',
      created: '2026-09-01 12:00:00',
    },
    {
      status: 'lost',
      currency: 'USD',
      stake: 1000,
      payout: 0,
      settled_at: '2026-09-03 12:00:00',
      created: '2026-09-01 12:00:00',
    },
    {
      status: 'pending',
      currency: 'MXN',
      stake: 50000,
      payout: 0,
      settled_at: null,
      created: '2026-09-03 12:00:00',
    },
    {
      status: 'void',
      currency: 'MXN',
      stake: 10000,
      payout: 10000,
      settled_at: '2026-09-03 12:00:00',
      created: '2026-09-03 12:00:00',
    },
  ] as Bet[];
  assert.deepEqual(profitSeries(bets, 'MXN', 20), [
    { date: '2026-09-02', value: 90 },
    { date: '2026-09-03', value: -110 },
  ]);
  assert.equal(profitSeries(bets, 'MXN', null), null);
});
test('chart scale supports empty, zero and negative profit series', () => {
  for (const values of [[], [0], [-100, -200], [100, -50, 200]]) {
    const graph = lineGeometry(values);
    assert.ok(Number.isFinite(graph.zero));
    assert.ok(!graph.path.includes('NaN'));
    assert.ok(graph.min <= 0 && graph.max >= 0);
    assert.ok(graph.zero >= 36 && graph.zero <= 180);
  }
});
test('payout preview rounds decimal odds exactly like the backend', () => {
  assert.equal(winningPayout(1, '1.5'), 2);
  assert.equal(winningPayout(1005, '1.1'), 1106);
  assert.equal(winningPayout(10000, '1.9000'), 19000);
  assert.equal(winningPayout(99, '1.5555'), 154);
});
