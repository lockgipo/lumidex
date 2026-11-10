const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../damage.html'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const js=html.split('<script>').at(-1).split('</script>')[0];
test('new calculator is accessible from index; prior Explorer advanced tool remains untouched',()=>{
  assert.match(index,/href="damage\.html"/);
  assert.doesNotMatch(index,/href="tradeoff\.html"/);
  assert.doesNotMatch(html,/href="tradeoff\.html"/);
  assert.ok(fs.existsSync(path.join(__dirname,'../tradeoff.html')));
  assert.match(html,/src="combat-model\.js"/);
  assert.match(html,/src="damage-model\.js"/);
  assert.doesNotMatch(html,/id="character-import"|id="character-name"|explorer-import\.js/);
});
test('manual panel, dual net gear deltas, monster defense, crit and normal lanes are present',()=>{
 for(const id of ['map','monster','type','base-pierce','base-atk','base-crit','a-pierce','b-pierce',
  'a-atk','b-atk','a-crit','b-crit','panel-attack','a-flat','b-flat',
  'normal-a','normal-b','crit-a','crit-b','diff-normal','diff-crit','warnings','result-status','reset','example']){
   assert.ok(html.includes('id="'+id+'"'),id);
 }
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size,'no duplicate HTML IDs');
 assert.match(html,/命中/);
 assert.match(html,/不考慮爆擊機率/);
 assert.match(html,/待實測/);
 assert.doesNotMatch(js,/expectedPerAttempt|critAverage|hitChance|dps\s*=/);
 assert.doesNotThrow(()=>new Function(js));
});
test('new browser calculator never sends player data to Explorer/backend and saves only to local browser',()=>{
 assert.match(js,/fetch\('data\.json'\)/);
 assert.match(js,/fetch\('monster-stats\.json'\)/);
 assert.match(js,/LumiDamage\.compare/);
 assert.match(js,/localStorage\.setItem/);
 assert.match(js,/localStorage\.removeItem/);
 assert.doesNotMatch(js,/fetch\(.*(?:explorer|vercel|api\/player)/);
 assert.doesNotMatch(html,/<form[^>]+action=/);
});
