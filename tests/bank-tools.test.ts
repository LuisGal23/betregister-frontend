import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fractionalKelly } from '../src/app/shared/utils/kelly.utils.ts';
import { sportEfficiency } from '../src/app/features/overview/models/sport-efficiency.ts';

test('quarter Kelly uses available bank, a real probability estimate and decimal odds',()=>{
 const q=fractionalKelly(1000000,2,60,.25)!;
 assert.ok(Math.abs(q.full-.2)<1e-12);
 assert.equal(q.amountMinor,50000);
 assert.equal(fractionalKelly(800000,2,60,.25)!.amountMinor,40000);
 assert.equal(fractionalKelly(1000000,2,60,.5)!.amountMinor,100000);
 assert.equal(q.breakEvenPercent,50);
});
test('Kelly returns zero for negative/no edge and handles zero bankroll',()=>{
 for(const p of [0,40,50])assert.equal(fractionalKelly(1000000,2,p,.25)!.amountMinor,0);
 assert.equal(fractionalKelly(0,2,60,.25)!.amountMinor,0);
 assert.equal(fractionalKelly(1000000,2,100,.5)!.amountMinor,500000);
});
test('invalid or missing Kelly inputs remain unavailable, never an invented estimate',()=>{
 for(const args of [[10000,null,55,.25],[10000,1,55,.25],[10000,NaN,55,.25],[10000,2,null,.25],[10000,2,101,.25],[10000,2,-1,.25],[10000,2,Infinity,.25],[-1,2,60,.25],[10000,2,60,1]] as [number,number|null,number|null,number][]){assert.equal(fractionalKelly(...args),null);}
});
test('Kelly rounds money downward to a cent without overdrawing',()=>{
 const result=fractionalKelly(12345,1.9,60,.25)!;
 assert.equal(result.amountMinor,480);
 assert.ok(result.amountMinor<=12345*result.allocation);
});
test('efficiency ignores pending, void and cashout; no records are not zero accuracy',()=>{
 const rows=sportEfficiency([{status:'won',sport_tag:'Fútbol'},{status:'lost',sport_tag:'Fútbol'},{status:'pending',sport_tag:'Fútbol'},{status:'void',sport_tag:'Fútbol'},{status:'cashout',sport_tag:'Fútbol'}]);
 assert.equal(rows[0].total,2);assert.equal(rows[0].rate,50);
 assert.equal(rows.find(r=>r.name==='KBO')!.rate,null);
});
test('multi-sport tickets count once as mixed; MLB and KBO stay separate',()=>{
 const rows=sportEfficiency([{status:'won',sport_tag:'Mixto',selection_details:[{sport:'Fútbol'},{sport:'Béisbol'}]},{status:'lost',sport_tag:'Béisbol',league_tag:'MLB'},{status:'won',sport_tag:'Béisbol',league_tag:'KBO'},{status:'won'}]);
 assert.equal(rows.reduce((sum,r)=>sum+r.total,0),4);
 assert.equal(rows.find(r=>r.name==='Mixtos')!.won,1);
 assert.equal(rows.find(r=>r.name==='MLB')!.rate,0);
 assert.equal(rows.find(r=>r.name==='KBO')!.rate,100);
 assert.equal(rows.find(r=>r.name==='Fútbol')!.total,0);
 assert.equal(rows.find(r=>r.name==='Sin clasificar')!.total,1);
});
