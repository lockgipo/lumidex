const test=require('node:test');
const assert=require('node:assert/strict');
const Tradeoff=require('../tradeoff-model.js');
const battle=require('../monster-stats.json');
const wyvern=battle.monsters['monster-amethyst-wyvern'];
const approximate=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`expected ${b}, got ${a}`);
const base={
  attackType:'physical',pierce:35,hit:350,critChance:30,
  critDamageBonus:40,attackBonusPct:20,dex:200
};

test('unchanged configuration returns neutral factor with official defense/crit/HIT rules',()=>{
  const r=Tradeoff.compare(wyvern,base,{...base},{observedNoncrit:20000});
  approximate(r.factors.armor,1);
  approximate(r.factors.hit,1);
  approximate(r.factors.crit,1);
  approximate(r.factors.attack,1);
  approximate(r.totalRatio,1);
  approximate(r.hitChanceA,0.975);
  approximate(r.normalDamageA,20000);
  approximate(r.normalDamageB,20000);
  approximate(r.critDamageA,48000);
  approximate(r.expectedPerAttemptA,20000*1.42*0.975);
  assert.equal(r.hitsNormalA,13);
  assert.equal(r.hitsNormalB,13);
  assert.equal(r.complete,true);
  assert.equal(r.assumptions.length,0);
});

test('armor loss can outweigh ATK percentage and critical damage gain',()=>{
  const alt={...base,pierce:25,attackBonusPct:28,critDamageBonus:52};
  const r=Tradeoff.compare(wyvern,base,alt,{observedNoncrit:20000});
  approximate(r.factors.armor,5/6);
  approximate(r.factors.attack,1.28/1.2);
  approximate(r.factors.crit,(1+0.3*1.52)/(1+0.3*1.4));
  approximate(r.totalRatio,(5/6)*(1.28/1.2)*(1.456/1.42));
  assert.ok(r.totalRatio<1);
  assert.ok(r.expectedPerAttemptB<r.expectedPerAttemptA);
  assert.equal(r.complete,true);
  assert.ok(r.assumptions.some(a=>a.includes('ATK%')));
  approximate(r.normalDamageB,20000*(5/6)*(1.28/1.2));
  assert.equal(r.hitsNormalA,13);
  assert.equal(r.hitsNormalB,15);
});

test('DEX changes require user calibration, never fake a universal damage conversion',()=>{
  const alt={...base,dex:215};
  const incomplete=Tradeoff.compare(wyvern,base,alt,{observedNoncrit:20000});
  assert.equal(incomplete.complete,false);
  assert.equal(incomplete.totalRatio,null);
  assert.equal(incomplete.normalDamageB,null);
  assert.equal(incomplete.hitsNormalB,null);
  assert.ok(incomplete.missing.some(s=>s.includes('DEX')));
  approximate(incomplete.factors.armor,1);
  const calibrated=Tradeoff.compare(wyvern,base,alt,{observedNoncrit:20000,panelAttack:2000,attackPerDex:4});
  assert.equal(calibrated.complete,true);
  approximate(calibrated.factors.attack,2060/2000);
  approximate(calibrated.normalDamageB,20600);
  assert.ok(calibrated.assumptions.some(s=>s.includes('DEX')));
});

test('magic uses MDEF; crit-disabled skill ignores critical factors',()=>{
  const magic={...base,attackType:'magic',pierce:35};
  const alt={...magic,pierce:45,critChance:100,critDamageBonus:90};
  const noCrit=Tradeoff.compare({...wyvern,mdef:90},magic,alt,{skillCanCrit:false,guaranteedHit:true});
  approximate(noCrit.factors.armor,1);
  approximate(noCrit.factors.hit,1);
  approximate(noCrit.factors.crit,1);
  approximate(noCrit.totalRatio,1);
  const crit=Tradeoff.compare({...wyvern,mdef:225},magic,alt);
  assert.ok(crit.factors.crit>1);
  assert.ok(crit.factors.armor>1);
});

test('invalid or contradictory inputs are rejected',()=>{
  assert.throws(()=>Tradeoff.compare(wyvern,base,{...base,attackType:'magic'}),/attackType/);
  assert.throws(()=>Tradeoff.compare(wyvern,base,{...base,pierce:-1}),/pierce/);
  assert.throws(()=>Tradeoff.compare(wyvern,base,{...base,critChance:101}),/critChance/);
  assert.throws(()=>Tradeoff.compare(wyvern,base,{...base,dex:210},{panelAttack:2000,attackPerDex:-1000}),/nonnegative/);
  assert.throws(()=>Tradeoff.compare(wyvern,base,base,{observedNoncrit:-1}),/observedNoncrit/);
});
