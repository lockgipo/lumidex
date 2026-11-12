const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const db=require('../data.json');
const stats=require('../monster-stats.json');
const Filters=require('../card-filters.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const byId=(items,id)=>items.find(x=>x.id===id);
const official='https://lumivaraonline.com/wiki/';

test('2026-11-12 official catalog snapshot covers cards, monsters, maps and ETC',()=>{
 assert.deepEqual([db.cards.length,db.monsters.length,db.maps.length,db.materials.length],[100,100,20,80]);
 assert.equal(db.meta.version,'0.4.0');
 assert.equal(db.meta.checked,'2026-11-12');
 assert.equal(stats.meta.count,100);
 const names=new Set(),urls=new Set();
 for(const c of db.cards){
  assert.ok(c.wiki.startsWith(official+'cards/'),c.id);
  assert.ok(!urls.has(new URL(c.wiki).pathname),'duplicate official card '+c.name);
  urls.add(new URL(c.wiki).pathname);
  assert.ok(!names.has(c.name),'duplicate canonical card '+c.name);
  names.add(c.name);
 }
 assert.equal(urls.size,100);
 assert.equal(new Set(Object.keys(stats.monsters)).size,100);
 assert.equal(new Set(db.maps.map(x=>x.name)).size,20);
 assert.equal(new Set(db.monsters.map(x=>x.id)).size,100);
 assert.equal(new Set(db.materials.map(x=>x.id)).size,80);
});

test('physical dragons and new magic foxes are distinct official cards, without losing saved IDs',()=>{
 const old=[
  ['card-crystal-fox','Crystal Dragon Card','lm01p_rare_card'],
  ['card-rose-fox','Rose Dragon Card','lm01p_epic_card'],
  ['card-golden-fox','Golden Dragon Card','lm01p_legendary_card'],
  ['card-pierce-empress','Pierce Dragon Card','lm01p_limited_card']
 ];
 for(const [id,name,slug] of old){
  const c=byId(db.cards,id);
  assert.equal(c.name,name);
  assert.equal(new URL(c.wiki).pathname,'/wiki/cards/'+slug+'/');
  assert.ok(c.previousName,'legacy search alias '+id);
  assert.equal(c.translationStatus,'tentative');
  assert.ok(Filters.classify(c).includes('piercePhysical'));
  assert.ok(!Filters.classify(c).includes('pierceMagic'));
 }
 const magic=[
  ['card-crystal-fox-arcane','Crystal Fox Card',1],
  ['card-rose-fox-arcane','Rose Fox Card',2],
  ['card-golden-fox-arcane','Golden Fox Card',3],
  ['card-arcane-piercer','Arcane Piercer Card',4]
 ];
 for(const [id,name,n] of magic){
  const c=byId(db.cards,id);
  assert.equal(c.name,name);
  assert.match(c.effect,new RegExp('MCRIT \\+'+n));
  const tags=Filters.classify(c);
  assert.ok(tags.includes('magicCritRate')&&tags.includes('matk')&&tags.includes('pierceMagic'),id);
  assert.ok(!tags.includes('atk')&&!tags.includes('piercePhysical')&&!tags.includes('critRate'),id);
 }
 assert.match(html,/c\.previousName\|\|''/);
 assert.match(html,/lumidex-v1-/);
});

test('new 141–150 maps have exactly 4 normal monsters and 1 Leader, with stats',()=>{
 const names=['Frostbell Toyworks','Frostbell Chocolate Works'];
 for(const name of names){
  const map=db.maps.find(m=>m.name===name);
  assert.ok(map&&map.range[0]===141&&map.range[1]===150);
  assert.equal(map.monsters.length,5);
  assert.equal(map.monsters.filter(id=>byId(db.monsters,id)?.leader).length,1);
  assert.equal(map.translationStatus,'tentative');
  for(const id of map.monsters){
   const monster=byId(db.monsters,id);
   assert.equal(monster?.map,name);
   assert.equal(stats.monsters[id]?.wiki.startsWith('https://www.lumivaraonline.com/wiki/monsters/'),true,id);
   assert.ok(stats.monsters[id].hp>=1500000,id);
  }
 }
});

test('eight new mechanic cards have verified drops and ETC sources while keeping conditional effects separate',()=>{
 const stems=['gingerbread-man','wind-up-teddy','jack-in-the-box','nutcracker-soldier','gummy-bear','cocoa-imp','marshmallow-brute','chocolate-golem'];
 assert.equal(db.cards.filter(c=>c.special).length,30);
 assert.equal(db.cards.filter(c=>c.verifiedDrops.length>0).length,80);
 for(const stem of stems){
  const card=byId(db.cards,'card-'+stem),monster=byId(db.monsters,'monster-'+stem);
  assert.ok(card&&monster,stem);
  assert.equal(card.special,true);
  assert.deepEqual(Filters.classify(card),['special']);
  assert.ok(card.verifiedDrops.some(d=>d.monster===monster.id&&d.rate>0));
  assert.equal(card.mapHint,monster.map);
  assert.ok(card.npcSell>0);
  assert.ok(card.cardPackRate>0);
  const mat=db.materials.find(x=>x.sourceMonster===monster.id);
  assert.ok(mat,stem);
  assert.equal(mat.dropRate,30);
  assert.ok(mat.npcSell>=99 && mat.npcSell<=110);
  assert.equal(mat.translationStatus,'tentative');
 }
 const c=byId(db.cards,'card-nutcracker-soldier');
 assert.ok(c.verifiedDrops.some(d=>d.monster==='monster-leader-nutcracker-soldier'));
});

test('MCRIT official stat is tracked separately from CRIT in legacy rare cards',()=>{
 for(const [id,value] of [['card-crimson-knight',5],['card-bloodcrystal-dragon',7],['card-critical-king',7]]){
  const c=byId(db.cards,id);
  assert.ok(c.effect.includes('MCRIT +'+value));
  const tags=Filters.classify(c);
  assert.ok(tags.includes('magicCritRate')&&tags.includes('critRate'));
 }
 assert.ok(html.includes('官方目前同時有 CRIT 與 MCRIT'));
 assert.ok(!html.includes('尚未收錄獨立 MCRIT'));
});
