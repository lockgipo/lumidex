const test=require('node:test');
const assert=require('node:assert/strict');
const Import=require('../explorer-import.js');
const character={
  name:'SampleUser',classId:1,level:100,
  gear:[
    {name:'III Obsidian Ring',slot:'accessory1',tier:3,worn:true,bonuses:{pierce:3,crit:6,vit:6,atk:40},cards:['cobra_card']},
    {name:'III Platinum Ring',slot:'accessory1',tier:3,worn:true,bonuses:{atk:36,critDmg:6,hit:5},cards:[]},
    {name:'III Bow',slot:'sword',tier:3,worn:true,bonuses:{atk:30,dex:5},cards:[]},
    {name:'V Bow',slot:'sword',tier:5,bonuses:{atk:120,dex:10,hit:10},cards:[]}
  ],
  storage:{gear:[
    {name:'V Obsidian Ring',slot:'accessory1',tier:5,bonuses:{pierce:7,critDmg:8,dex:10,hit:3,atk:20},cards:['wolf_card']},
    {name:'V Shoes',slot:'shoes',tier:5,bonuses:{def:10}}
  ]}
};
test('sanitize official Explorer result and distinguish worn items from storage candidates',()=>{
  const p=Import.normalize({player:character});
  assert.equal(p.name,'SampleUser');
  assert.equal(p.equipped.length,3);
  assert.equal(p.candidates.length,3);
  assert.equal(p.candidates.filter(x=>x.source==='倉庫').length,2);
  assert.equal(p.equipped[0].cards[0],'cobra_card');
  assert.ok(p.equipped[0].key!==p.equipped[1].key);
  assert.equal(p.equipped[0].slot,'accessory1');
  assert.ok(!JSON.stringify(p).includes('silver'));
});
test('two accessory1 gear are separate worn items, candidate filters by compatible slot',()=>{
  const p=Import.normalize({player:character});
  const rings=Import.compatible(p.candidates,p.equipped[0]);
  assert.equal(rings.length,1);
  assert.equal(rings[0].name,'V Obsidian Ring');
  assert.equal(Import.compatible(p.candidates,p.equipped[2]).length,1);
});
test('display delta handles flat ATK separately from ATK% and crit from critical chance',()=>{
  const p=Import.normalize({player:character});
  const delta=Import.diff(p.equipped[0],Import.compatible(p.candidates,p.equipped[0])[0]);
  assert.equal(delta.pierce,4);
  assert.equal(delta.crit,-6);
  assert.equal(delta.atk,-20);
  assert.equal(delta.critDmg,8);
  assert.equal(delta.dex,10);
  const adjusted=Import.suggest({
    pierceA:35,pierceB:25,atkA:20,atkB:28,critdA:40,critdB:52,
    hitA:350,hitB:350,dexA:200,dexB:200,critA:30,critB:30
  },delta,'physical');
  assert.deepEqual(adjusted,{pierceB:39,critdB:48,hitB:353,dexB:210});
  assert.ok(!('atkB' in adjusted));
  assert.ok(!('critB' in adjusted));
  const magic=Import.suggest({pierceA:20,critdA:10,hitA:350,dexA:200},delta,'magic');
  assert.ok(!('pierceB' in magic));
});
test('sanitizer rejects mismatched names or malformed data and ignores sensitive or unsafe keys',()=>{
  assert.throws(()=>Import.normalize({player:character},'OtherUser'),/name/i);
  assert.throws(()=>Import.normalize({player:{name:'SampleUser'}},'SampleUser'),/gear/i);
  assert.throws(()=>Import.normalize({player:{name:'SampleUser',gear:'bad'}},'SampleUser'),/gear/i);
  assert.throws(()=>Import.normalize({player:character},'!bad<script>'),/name/i);
  const modified={...character,secret:'should-not-import',gear:[{...character.gear[0],bonuses:{atk:40,'__proto__':10,evil:'x'}}]};
  const out=Import.normalize({player:modified});
  assert.equal(out.equipped[0].bonuses.atk,40);
  assert.ok(!Object.hasOwn(out.equipped[0].bonuses,'evil'));
  assert.ok(!JSON.stringify(out).includes('secret'));
});
test('stale gear data does not silently corrupt input with negative B totals',()=>{
  const p=Import.normalize({player:character});
  const d=Import.diff(p.equipped[1],p.candidates[1]);
  assert.ok(Object.values(d).some(n=>n<0));
  assert.throws(()=>Import.suggest({pierceA:0,critdA:0,hitA:0,dexA:0},d,'physical'),/negative/i);
});
