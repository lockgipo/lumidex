const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../gear-sets.js');
test('11 verified sets: two-piece repeat up to three times, four-piece one time, six-piece one time',()=>{
 assert.equal(m.definitions.length,11);
 assert.equal(m.evaluate('warlord',1).stacks,0);
 assert.equal(m.evaluate('warlord',2).bonus.atkPct,10);
 assert.equal(m.evaluate('warlord',3).bonus.atkPct,10);
 assert.equal(m.evaluate('warlord',4).bonus.atkPct,20);
 assert.equal(m.evaluate('warlord',6).bonus.atkPct,30);
 assert.equal(m.evaluate('armor-breaker',6).bonus.pierce,21);
 assert.equal(m.evaluate('executioner',6).bonus.critDmg,45);
 assert.equal(m.evaluate('lucky-star',4).bonus.crit,20);
 assert.equal(m.evaluate('hawkeye',3).stacks,0);
 assert.equal(m.evaluate('hawkeye',4).bonus.hit,250);
 assert.equal(m.evaluate('mystic-sage',4).bonus.dex,30);
 assert.equal(m.evaluate('phantom-dancer',4).bonus.flee,200);
 assert.equal(m.evaluate('blood-lord',5).stacks,0);
 assert.equal(m.evaluate('blood-lord',6).bonus.damageDealtPct,-30);
});
test('4 to 3 Hawkeye loses its whole set bonus, separately for A and B',()=>{
 const r=m.compare([{id:'hawkeye',a:4,b:3}]);
 assert.deepEqual(r.delta,{hit:-250,atkPct:-10,matkPct:-10,moveSpeedPct:-7});
 assert.equal(r.entries[0].a.active,true);
 assert.equal(r.entries[0].b.active,false);
 assert.equal(r.unmodeled.includes('moveSpeedPct'),true);
});
test('independent 2-piece sets coexist, stack and count at most six armor slots',()=>{
 const r=m.compare([{id:'warlord',a:2,b:0},{id:'archmage',a:0,b:2},{id:'executioner',a:2,b:2}]);
 assert.equal(r.totalA,4);assert.equal(r.totalB,4);
 assert.deepEqual(r.delta,{atkPct:-10,matkPct:10});
 assert.throws(()=>m.compare([{id:'warlord',a:4,b:4},{id:'archmage',a:4,b:0}]),/最多只能/);
 assert.throws(()=>m.compare([{id:'warlord',a:2,b:2},{id:'warlord',a:2,b:0}]),/不重複/);
 assert.throws(()=>m.compare([{id:'warlord',a:2.5,b:0}]),/整數/);
 assert.throws(()=>m.compare([{id:'warlord',a:7,b:0}]),/整數/);
 assert.throws(()=>m.compare([{id:'fake',a:2,b:0}]),/套裝/);
 assert.deepEqual(m.compare([]).delta,{});
});
test('set effect and gear effect merge without counting saved B example values',()=>{
 const a={pierceA:35,atkA:20,critdA:40,critA:30,hitA:350,dexA:200};
 const gear={pierceB:38,critdB:46,dexB:205};
 const sets=m.compare([{id:'warlord',a:0,b:2},{id:'armor-breaker',a:2,b:0}]);
 const b=m.composeValues(a,gear,sets.delta,'physical');
 assert.deepEqual(b,{pierceB:31,atkB:30,critdB:46,critB:30,hitB:350,dexB:205});
 const mg=m.compare([{id:'archmage',a:0,b:2},{id:'spellbreaker',a:0,b:2}]);
 assert.equal(m.composeValues(a,{},mg.delta,'magic').atkB,30);
 assert.equal(m.composeValues(a,{},mg.delta,'magic').pierceB,42);
 assert.equal(m.format('crit',10),'CRIT 點數 +10');
});
test('Blood Lord special damage multiplier change cannot silently enter A/B',()=>{
 const sets=m.compare([{id:'blood-lord',a:0,b:6}]);
 assert.equal(sets.blocksDamageComparison,true);
 assert.ok(sets.unmodeled.includes('damageDealtPct'));
 assert.throws(()=>m.composeValues({pierceA:35,atkA:20,critdA:40,critA:30,hitA:350,dexA:200},{},sets.delta,'physical'),/Blood Lord/);
});
test('reject an A panel too low to absorb lost set bonuses',()=>{
 const a={pierceA:3,atkA:0,critdA:0,critA:0,hitA:350,dexA:200};
 const lost=m.compare([{id:'armor-breaker',a:2,b:0}]);
 assert.throws(()=>m.composeValues(a,{},lost.delta,'physical'),/低於 0/);
});
