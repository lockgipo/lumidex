const test=require('node:test');
const assert=require('node:assert/strict');
const Sets=require('../gear-sets.js');
const count=(id,n)=>({id,count:n});
test('all 11 official sets have exact 2/4/6 thresholds and no invented set from Explorer',()=>{
 assert.equal(Sets.catalog.length,11);
 assert.equal(Sets.catalog.filter(x=>x.threshold===2).length,7);
 assert.equal(Sets.catalog.filter(x=>x.threshold===4).length,3);
 assert.equal(Sets.catalog.filter(x=>x.threshold===6).length,1);
 for(const s of Sets.catalog)assert.equal(Sets.calculate([count(s.id,s.threshold-1)]).active.length,0,s.id);
});
test('two-piece set stacks once at 2, twice at 4, three times at 6, not at odd threshold',()=>{
 for(const [n,bonus] of [[1,0],[2,10],[3,10],[4,20],[5,20],[6,30]]){
   const r=Sets.calculate([count('warlord',n)]);
   assert.equal(r.bonuses.atkPct,bonus);
   assert.equal(r.active[0]?.stacks||0,Math.floor(n/2));
 }
 assert.equal(Sets.calculate([count('armor_breaker',6)]).bonuses.pierce,21);
 assert.equal(Sets.calculate([count('spellbreaker',4)]).bonuses.magicPierce,14);
 assert.equal(Sets.calculate([count('executioner',4)]).bonuses.critDmg,30);
});
test('four-piece sets only activate at 4, not at 2; six-piece blood lord only at 6',()=>{
 assert.equal(Sets.calculate([count('hawkeye',3)]).bonuses.hit,0);
 assert.equal(Sets.calculate([count('hawkeye',4)]).bonuses.hit,250);
 assert.equal(Sets.calculate([count('hawkeye',6)]).bonuses.hit,250);
 assert.equal(Sets.calculate([count('mystic_sage',4)]).bonuses.dex,30);
 assert.equal(Sets.calculate([count('blood_lord',5)]).damageMultiplier,1);
 assert.equal(Sets.calculate([count('blood_lord',6)]).damageMultiplier,0.7);
});
test('mixed sets share six armor slots and add only activated bonuses',()=>{
 const r=Sets.calculate([count('warlord',2),count('executioner',2),count('armor_breaker',2)]);
 assert.equal(r.totalPieces,6);
 assert.equal(r.active.length,3);
 assert.equal(r.bonuses.atkPct,10);
 assert.equal(r.bonuses.critDmg,15);
 assert.equal(r.bonuses.pierce,7);
 assert.throws(()=>Sets.calculate([count('warlord',4),count('executioner',4)]),/6 件/);
 assert.throws(()=>Sets.calculate([count('warlord',2),count('warlord',2)]),/合併/);
 assert.throws(()=>Sets.calculate([count('warlord',0)]),/1～6/);
 assert.throws(()=>Sets.calculate([count('unknown',2)]),/未知/);
});
test('set effects only adjust supported attack fields and never auto-convert CRIT points',()=>{
 const base={attackType:'physical',attackBonusPct:20,pierce:30,critDamageBonus:40,hit:350,dex:200,critChance:30};
 const sum=Sets.calculate([count('hawkeye',4),count('armor_breaker',2)]);
 const p=Sets.apply(base,sum);
 assert.equal(p.attackBonusPct,30);
 assert.equal(p.pierce,37);
 assert.equal(p.hit,600);
 assert.equal(p.critChance,30);
 const magic=Sets.apply({...base,attackType:'magic'},sum);
 assert.equal(magic.attackBonusPct,30);
 assert.equal(magic.pierce,30);
 const luck=Sets.apply(base,Sets.calculate([count('lucky_star',2)]));
 assert.equal(luck.critChance,30);
 assert.equal(Sets.calculate([count('lucky_star',2)]).bonuses.crit,10);
});
test('inactive set and unmodelled survivability effects stay visible in descriptions',()=>{
 const r=Sets.calculate([count('iron_bastion',2),count('lucky_star',2),count('warlord',1)]);
 assert.equal(r.bonuses.hp,500);
 assert.equal(r.bonuses.def,7);
 assert.equal(r.bonuses.crit,10);
 assert.match(Sets.describe(r.inactive[0]),/尚未啟動/);
 assert.match(Sets.describe(r.active[0]),/已啟動/);
});

test('unknown/prototype-named set IDs cannot be used as official sets',()=>{
 assert.throws(()=>Sets.calculate([{id:'__proto__',count:2}]),/未知/);
 assert.throws(()=>Sets.calculate([{id:'constructor',count:2}]),/未知/);
});
