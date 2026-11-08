const test=require('node:test');
const assert=require('node:assert/strict');
const zh=require('../gear-localization.js');
const jobs=require('../gear-picker.js');
test('official equipment names localize without changing English or tiers/refine',()=>{
 const cases=[
  ['+4 III Bow','+4 III 弓'],['IV Katana','IV 武士刀'],
  ['IV Night Cloak','IV 夜影披風'],['III Platinum Ring','III 白金戒指'],
  ['III Traveler Hat','III 旅行者帽'],['III Explorer Glasses','III 探險者眼鏡'],
  ['III Leather Boots','III 皮靴'],['III Red Scarf','III 紅色圍巾'],
  ['V Viper Kunai','V 毒蛇苦無'],['IV Cestus','IV 拳套']
 ];
 for(const [en,ch] of cases){
   const result=zh.translated(en);
   assert.equal(result.zh,ch,en);
   assert.equal(result.english,en,en);
   assert.equal(result.translated,true,en);
 }
});
test('unrecognized equipment stays in English rather than inventing a translation',()=>{
 const unknown=zh.translated('V Unknown Relic');
 assert.equal(unknown.zh,'V Unknown Relic');
 assert.equal(unknown.translated,false);
 assert.equal(zh.subtitle({name:'V Unknown Relic'}),'');
 assert.equal(zh.slot('sword'),'右手武器');
 assert.equal(zh.slot('accessory1'),'飾品');
});
test('all advanced classes are included and correctly restricted to official weapons',()=>{
 const wanted={
   kensei:'katana',iron_fist:'cestus',wicked_necromancer:'rune_grimoire',
   king:'royal_tablet',sinister:'twin_pistols',templar:'lionheart_aegis',
   nekobaku:'neko_flask',mamushi:'viper_kunai'
 };
 assert.equal(Object.keys(jobs.jobs).length,15);
 assert.equal(Object.values(jobs.jobs).filter(x=>x.group==='advanced').length,8);
 for(const [job,weapon] of Object.entries(wanted)){
   assert.equal(jobs.usability({slot:'sword',template:weapon},job),'allowed',job);
   assert.equal(jobs.usability({slot:'sword',template:'bow'},job),'blocked',job);
   assert.equal(jobs.inferJobFromEquipped([{slot:'sword',template:weapon}]),job,job);
 }
 assert.equal(jobs.normalizeJob('The King'),'king');
 assert.equal(jobs.normalizeJob('ironFist'),'iron_fist');
 assert.equal(jobs.normalizeJob('Wicked Necromancer'),'wicked_necromancer');
 assert.equal(jobs.normalizeJob('wickednecromancer'),'wicked_necromancer');
 assert.equal(jobs.usability({slot:'sword',template:'unmapped'},'mamushi'),'unknown');
 assert.equal(jobs.usability({slot:'armor',name:'III Coat'},'mamushi'),'unknown');
});
test('Thief can use Dagger Pair and both English/Chinese search find same gear',()=>{
 assert.equal(jobs.usability({slot:'sword',template:'dagger_pair'},'thief'),'allowed');
 assert.equal(jobs.usability({slot:'sword',template:'dagger_pair'},'archer'),'blocked');
 const ring={key:'s:1',slot:'accessory1',source:'倉庫',name:'IV Platinum Ring',bonuses:{dex:11}};
 const base={slot:'accessory1'};
 assert.equal(jobs.relatedCandidates([ring],base,'archer',{query:'白金戒指'}).visible.length,1);
 assert.equal(jobs.relatedCandidates([ring],base,'archer',{query:'Platinum'}).visible.length,1);
});
test('web page displays localized worn/alternative gear, dynamic full jobs, and version v0.8.4',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync(require('node:path').join(__dirname,'../tradeoff.html'),'utf8');
 assert.match(html,/<title>[^<]*v0\.8\.4/);
 assert.match(html,/src="gear-localization\.js"/);
 assert.ok(html.indexOf('src="gear-localization.js"')<html.indexOf('src="gear-picker.js"'));
 assert.match(html,/renderJobOptions\(\)/);
 assert.match(html,/Object\.entries\(LumiGearPicker\.jobs\)/);
 assert.match(html,/LumiGearZh\.title\(gear\)/);
 assert.match(html,/LumiGearZh\.title\(g\)/);
 assert.match(html,/LumiGearZh\.slot\(gear\.slot\)/);
 assert.match(html,/進階／擴充職業/);
 assert.doesNotMatch(html,/value="archer">Archer/);
 const js=html.split('<script>').at(-1).split('</script>')[0];
 assert.doesNotThrow(()=>new Function(js));
});
