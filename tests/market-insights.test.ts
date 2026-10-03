import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupMarkets, rankedMarkets, matchesInsightTags, type InsightBet } from '../src/app/features/insights/models/market-insights.ts';
import { marketsForLeague, sportForLeague } from '../src/app/features/bets/models/bet-tags.ts';

const ticket = (changes: Partial<InsightBet> = {}): InsightBet => ({id:1,house_id:1,event:'Ficticio',status:'won',stake:10000,payout:19000,currency:'MXN',sport_tag:'Béisbol',market_tag:'ML',bet_type:'simple',created:'2026-09-30',...changes});
const money = (minor: number) => minor / 100;

test('sport and market filters must match the same selection in mixed tickets', () => {
  const bet=ticket({selection_details:[{sport:'Fútbol',market:'Goles'},{sport:'Béisbol',market:'ML'}]});
  assert.equal(matchesInsightTags(bet,'Fútbol','ML'),false);
  assert.equal(matchesInsightTags(bet,'Béisbol','ML'),true);
  assert.equal(matchesInsightTags(bet,'','Goles'),true);
});

test('market view counts repeated selections only once per ticket; types never duplicate profit', () => {
  const b=ticket({bet_type:'parlay',selection_details:[{sport:'Fútbol',market:'Goles'},{sport:'Fútbol',market:'Goles'},{sport:'Fútbol',market:'Córners'}]});
  const markets=groupMarkets([b],money,'market');
  assert.equal(markets.length,2);
  for(const group of markets) { assert.equal(group.total,1); assert.equal(group.profit,90); }
  const types=groupMarkets([b],money,'type');
  assert.equal(types.length,1); assert.equal(types[0].profit,90); assert.equal(types[0].market,'Parlays');
});

test('Other remains a traceable category and preserves its description', () => {
  const [group]=groupMarkets([ticket({selection_details:[{sport:'Béisbol',market:'Otro',description:'Jugador consigue dos hits'}]})],money,'market');
  assert.equal(group.market,'Otro');
  assert.equal(group.tickets[0].selection_details![0].description,'Jugador consigue dos hits');
});

test('winning more often is not ranked above actual net profit', () => {
  const groups=groupMarkets([
    ticket({stake:1000,payout:1100}),ticket({id:2,stake:1000,payout:1100}),ticket({id:3,status:'lost',stake:10000,payout:0}),
    ticket({id:4,market_tag:'Over carreras',payout:23000}),
  ],money);
  const ml=groups.find(g=>g.market==='ML')!;
  assert.equal(ml.won,2);assert.equal(ml.lost,1);assert.equal(ml.profit,-98);
  assert.equal(rankedMarkets(groups).best?.market,'Over carreras');
  assert.equal(rankedMarkets(groups).worst?.market,'ML');
});

test('pending partial payouts and voids do not contaminate closed ticket performance', () => {
  const [group]=groupMarkets([ticket({status:'cashout',payout:7000}),ticket({id:2,status:'pending',payout:8000}),ticket({id:3,status:'void',payout:10000})],money);
  assert.equal(group.total,3);assert.equal(group.closed,1);assert.equal(group.cashout,1);
  assert.equal(group.pending,1);assert.equal(group.voided,1);
  assert.equal(group.staked,100);assert.equal(group.profit,-30);assert.equal(group.yield,-30);assert.equal(group.winRate,null);
});

test('sports, market units and combined ticket types stay separate', () => {
  const groups=groupMarkets([ticket(),ticket({id:2,bet_type:'same_game'}),ticket({id:3,market_tag:'Over'}),ticket({id:4,market_tag:'Over carreras'}),ticket({id:5,sport_tag:'Fútbol',market_tag:'Over goles'})],money);
  assert.equal(groups.length,5);
  const legacy=groups.find(g=>g.market==='Over')!;
  assert.equal(rankedMarkets([legacy]).best,null);
});

test('missing exchange rate is unavailable rather than zero or a fake ranking', () => {
  const groups=groupMarkets([ticket(),ticket({id:2,currency:'USD'})],(minor,currency)=>currency==='USD' ? null : money(minor));
  assert.equal(groups[0].profit,null);assert.equal(groups[0].yield,null);assert.equal(groups[0].staked,null);
  assert.equal(rankedMarkets(groups).best,null);assert.equal(rankedMarkets(groups).worst,null);
});

test('corrected returns and both currencies use the current recorded totals', () => {
  const [group]=groupMarkets([ticket({payout:15000}),ticket({id:2,currency:'USD',stake:1000,payout:2000})],(minor,currency)=>minor/100*(currency==='USD'?20:1));
  assert.equal(group.profit,250);assert.equal(group.staked,300);
  assert.ok(Math.abs(group.yield!-250/300*100)<0.0001);
});

test('markets follow league sport and preserve legacy units only explicitly', () => {
  assert.equal(sportForLeague('NFL'),'Americano');
  assert.ok(marketsForLeague('NFL').includes('Over puntos'));
  assert.ok(!marketsForLeague('NFL').includes('Over goles'));
  assert.ok(marketsForLeague('KBO').includes('Over carreras'));
  assert.ok(marketsForLeague('MLS').includes('Ambos anotan'));
  assert.ok(!marketsForLeague('MLB').includes('Over'));
  assert.ok(marketsForLeague('MLB','Over').includes('Over'));
});

test('all-negative or all-positive histories do not invent an opposite result', () => {
  assert.equal(rankedMarkets(groupMarkets([ticket({status:'lost',payout:0})],money)).best,null);
  assert.equal(rankedMarkets(groupMarkets([ticket()],money)).worst,null);
  assert.deepEqual(rankedMarkets([]),{best:null,worst:null,frequent:null});
});


test('explicit legacy units join structured markets without guessing generic Over',()=>{
 const old=ticket({market_tag:'Over carreras'}), current=ticket({id:2,selection_details:[{sport:'Béisbol',market:'Carreras'}]}), generic=ticket({id:3,market_tag:'Over'});
 const groups=groupMarkets([old,current,generic],money,'market');
 assert.equal(groups.find(g=>g.market==='Carreras')?.total,2);
 assert.equal(groups.find(g=>g.market==='Carreras')?.profit,180);
 assert.equal(groups.find(g=>g.market==='Over')?.total,1);
 assert.equal(matchesInsightTags(old,'Béisbol','Carreras'),true);
 assert.equal(matchesInsightTags(generic,'Béisbol','Carreras'),false);
});
test('pending tickets remain visible but never count as realized profit',()=>{
 const [group]=groupMarkets([ticket({status:'pending',payout:0})],money,'market');
 assert.equal(group.total,1);assert.equal(group.pending,1);assert.equal(group.closed,0);assert.equal(group.profit,0);assert.equal(rankedMarkets([group]).best,null);
});
test('international football league supports football markets',()=>{
 assert.equal(sportForLeague('Selecciones'),'Fútbol');assert.ok(marketsForLeague('Selecciones').includes('Goles'));
});
