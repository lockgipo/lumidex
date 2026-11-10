const test=require('node:test');
const assert=require('node:assert/strict');
const {compare,armor}=require('../damage-model.js');
const near=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-9,`${label||'value'} expected ${expected}, got ${actual}`);
const baseline={pierce:40,attackPct:50,critDamagePct:0};
const zero={pierce:0,attackPct:0,critDamagePct:0};
const options={defense:225,base:baseline,a:zero,b:zero};

test('official armor formula golden values, max DEF and over-pierce',()=>{
  near(armor(0,0),1,'zero DEF');
  near(armor(225,0),0.25);
  near(armor(225,40),0.65);
  near(armor(225,45),0.7);
  near(armor(255,0),0.15);
  near(armor(255,60),0.75);
  near(armor(255,85),1);
  near(armor(400,85),1);
  near(armor(255,120),1);
  near(armor(90,30),1);
});

test('noncritical pierce +5% has independent verified relative gain',()=>{
 const r=compare({...options,b:{...zero,pierce:5}});
 near(r.B.noncrit/ r.A.noncrit, 70/65);
 near(r.B.crit/r.A.crit,70/65);
 near(r.A.noncrit,1);
 near(r.B.noncrit,70/65);
 assert.equal(r.assumptions.length,0);
});

test('crit damage changes critical lane only, no crit chance or DPS',()=>{
 const r=compare({...options,base:{...baseline,critDamagePct:40},b:{...zero,critDamagePct:20}});
 near(r.B.noncrit,1);
 near(r.B.crit,(2.6/2.4));
 assert.equal('critChance' in r,false);
 assert.equal('dps' in r,false);
});

test('ATK% one-pool model is explicitly a hypothesis, not official verified',()=>{
 const r=compare({...options,b:{...zero,attackPct:10}});
 near(r.B.noncrit,1.6/1.5);
 near(r.B.crit,1.6/1.5);
 assert.match(r.assumptions.join(' '),/待實測|假設/);
 assert.equal(r.proven.atkStacking,false);
});

test('A and B each represent net swap deltas, negative old item bonuses must be deducted',()=>{
 const r=compare({defense:225,base:{pierce:40,attackPct:50,critDamagePct:20},
   a:{pierce:-5,attackPct:0,critDamagePct:0},
   b:{pierce:5,attackPct:-10,critDamagePct:10}});
 near(r.A.armor,0.6);
 near(r.B.armor,0.7);
 near(r.A.noncrit,0.6/0.65);
 near(r.B.noncrit,(0.7/0.65)*(1.4/1.5));
 near(r.relative.BvsA.noncrit,r.B.noncrit/r.A.noncrit);
 near(r.relative.BvsA.crit,r.B.crit/r.A.crit);
});

test('physical and magic use supplied target defense separately and never infer from HP',()=>{
 const p=compare({...options,defense:225,b:{...zero,pierce:5}});
 const m=compare({...options,defense:90,b:{...zero,pierce:5}});
 assert.ok(p.B.noncrit>m.B.noncrit);
 near(m.B.noncrit,1);
});

test('flat ATK requires a positive observed panel baseline, never invent rank without it',()=>{
 const opts={...options,a:{...zero,flatAttack:50},b:{...zero,attackPct:10}};
 const r=compare(opts);
 assert.equal(r.complete,false);
 assert.equal(r.A.noncrit,null);
 assert.equal(r.relative.BvsA.noncrit,null);
 assert.match(r.missing.join(' '),/ATK|MATK/);
 const full=compare({...opts,panelAttack:1500});
 // at 50% ATK the inferred pre-multiplier amount is 1000.
 near(full.A.noncrit,1.05);
 near(full.B.noncrit,1.6/1.5);
 assert.match(full.assumptions.join(' '),/面板|乘區/);
});

test('equal equipment has zero gain in both lanes even at high defense',()=>{
 for(const defense of [0,90,225,255,300]){
  for(const pierce of [0,20,85,130]){
   const r=compare({defense,base:{...baseline,pierce},a:zero,b:zero});
   near(r.A.noncrit,1);near(r.B.noncrit,1);
   near(r.A.crit,1);near(r.B.crit,1);
  }
 }
});

test('strict finite inputs and nonnegative resulting stats; no silent clipping',()=>{
 assert.throws(()=>armor(NaN,0),/finite|number/i);
 assert.throws(()=>armor(225,-1),/nonnegative|invalid/i);
 assert.throws(()=>compare({...options,base:{...baseline,pierce:-1}}));
 assert.throws(()=>compare({...options,b:{...zero,pierce:-41}}));
 assert.throws(()=>compare({...options,b:{...zero,critDamagePct:-1}}));
 assert.throws(()=>compare({...options,b:{...zero,attackPct:-51}}));
 assert.throws(()=>compare({...options,b:{...zero,attackPct:Infinity}}));
});

test('pierce monotonic bounded, no gain past full armor negation',()=>{
 for(let defense=0;defense<=300;defense+=15){
   let last=armor(defense,0);
   for(let pierce=1;pierce<=150;pierce++){
     const now=armor(defense,pierce);
     assert.ok(now+1e-12>=last);
     assert.ok(now<=1+1e-12 && now>=0.15-1e-12);
     last=now;
   }
 }
});
