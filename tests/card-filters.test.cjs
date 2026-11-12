const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const cards=require('../data.json').cards;
const monsters=require('../data.json').monsters;
const CardFilters=require('../card-filters.js');

test('effect taxonomy covers every card while keeping conditional effects separate',()=>{
  assert.equal(cards.length,100);
  assert.equal(cards.filter(c=>c.special).length,30);
  for(const card of cards){
    const tags=CardFilters.classify(card);
    assert.ok(tags.length>0,card.id+' has no tags');
    assert.ok(tags.every(tag=>CardFilters.categories.some(cat=>cat.id===tag)),card.id);
    if(card.special)assert.deepEqual(tags,['special'],card.id+' conditional effect is not a static bonus');
    else assert.ok(!tags.includes('special'),card.id);
  }
  const fox=cards.find(x=>x.id==='card-golden-fox');
  assert.deepEqual(CardFilters.classify(fox),['atk','piercePhysical','critRate']);
  const pierce=cards.find(x=>x.id==='card-lantern-wisp');
  assert.ok(CardFilters.classify(pierce).includes('pierceMagic'));
  assert.ok(!CardFilters.classify(pierce).includes('piercePhysical'));
  const thorn=cards.find(x=>x.id==='card-thorn-pixie');
  assert.ok(CardFilters.classify(thorn).includes('matk'));
  assert.ok(!CardFilters.classify(thorn).includes('atk'),'MATK must not be misclassified as ATK');
  const special=cards.find(x=>x.id==='card-titan-frame');
  assert.deepEqual(CardFilters.classify(special),['special']);
});

test('compound effect filters use AND within cards, and source selection is verified',()=>{
  const foxes=CardFilters.filterCards(cards,{categories:['atk','piercePhysical','critRate']},monsters);
  for(const id of ['card-crystal-fox','card-rose-fox','card-golden-fox','card-pierce-empress'])assert.ok(foxes.some(c=>c.id===id),id);
  assert.ok(!foxes.some(c=>c.id==='card-sunfire-colossus'));
  const byMap=CardFilters.filterCards(cards,{mapName:'Amethyst Hollows',source:'verifiedMonster'},monsters);
  assert.ok(byMap.length>0);
  assert.ok(byMap.every(c=>c.verifiedDrops.some(d=>monsters.find(m=>m.id===d.monster)?.map==='Amethyst Hollows')));
  const hollow=cards.find(c=>c.id==='card-hollow');
  assert.ok(CardFilters.filterCards(cards,{source:'special'},monsters).includes(hollow));
  assert.ok(!CardFilters.filterCards(cards,{source:'verifiedMonster'},monsters).includes(hollow));
  assert.equal(CardFilters.filterCards(cards,{source:'unverified'},monsters).some(c=>c.id==='card-hollow'),false);
  assert.ok(CardFilters.filterCards(cards,{source:'unverified'},monsters).every(c=>c.verifiedDrops.length===0&&!c.specialDrop));
  const verifiedByMonster=CardFilters.filterCards(cards,{monsterId:'monster-amethyst-wyvern',source:'verifiedMonster'},monsters);
  assert.ok(verifiedByMonster.length>0);
  assert.ok(verifiedByMonster.every(c=>c.verifiedDrops.some(d=>d.monster==='monster-amethyst-wyvern')));
  assert.deepEqual(CardFilters.filterCards(cards,{categories:['does-not-exist']},monsters),[]);
});

test('card filtering remains text-only; no bonus amounts are synthesized',()=>{
  const card=cards.find(c=>c.id==='card-obsidian-scorpion');
  assert.deepEqual(CardFilters.classify(card),['atk','critDamage']);
  assert.equal(CardFilters.classify(card).includes('piercePhysical'),false);
  assert.ok(cards.every(c=>typeof c.effect==='string'));
});

test('catalog retains stable IDs and local storage; new controls expose filter and farming actions',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/src="card-filters\.js"/);
  assert.match(html,/id="effect-filters"/);
  assert.match(html,/id="effect-buttons"/);
  assert.match(html,/id="sourcefilter"/);
  assert.match(html,/data-farm-map/);
  assert.match(html,/data-farm-mon/);
  assert.match(html,/lumidex-v1-/);
  assert.match(html,/id="slotfilter"/);
});

test('nested attribute groups use OR within a group and AND across groups',()=>{
  assert.deepEqual(CardFilters.detailGroups.map(g=>g.id),['baseStat','hpSp','defense']);
  const counts={baseStat:{str:5,agi:8,vit:5,int:9,dex:4,luk:5},hpSp:{hp:10,sp:4},defense:{def:9,mdef:8}};
  for(const group of CardFilters.detailGroups){
    const union=new Set();
    for(const opt of group.options){
      const matches=CardFilters.filterCards(cards,{details:{[group.id]:[opt.id]}},monsters);
      assert.equal(matches.length,counts[group.id][opt.id],group.id+':'+opt.id);
      matches.forEach(c=>{assert.equal(c.special,false);union.add(c.id)});
    }
    const combined=CardFilters.filterCards(cards,{details:{[group.id]:group.options.map(o=>o.id)}},monsters);
    assert.deepEqual(new Set(combined.map(c=>c.id)),union,'OR for '+group.id);
  }
  const atkStr=CardFilters.filterCards(cards,{categories:['atk'],details:{baseStat:['str']}},monsters);
  assert.ok(atkStr.every(c=>CardFilters.classify(c).includes('atk')&&/\bSTR\s*\+\s*\d/.test(c.effect)));
  const hpDef=CardFilters.filterCards(cards,{details:{hpSp:['hp','sp'],defense:['def']}},monsters);
  assert.ok(hpDef.every(c=>/\b(?:HP|SP)\s*\+\s*\d/.test(c.effect)&&/\bDEF\s*\+\s*\d/.test(c.effect)));
  assert.deepEqual(CardFilters.filterCards(cards,{details:{baseStat:['unknown']}},monsters),[]);
  assert.deepEqual(CardFilters.filterCards(cards,{details:{unknown:['str']}},monsters),[]);
  assert.equal(CardFilters.categories.find(c=>c.id==='baseStat').label,'主屬性');
  assert.equal(CardFilters.categories.find(c=>c.id==='critRate').label,'CRIT 暴擊率');
});
