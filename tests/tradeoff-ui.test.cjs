const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'tradeoff.html'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const analyzer=fs.readFileSync(path.join(root,'analyzer.html'),'utf8');
const script=html.split('<script>').at(-1).split('</script>')[0];

test('legacy A/B page retains features and source files but is hidden from main navigation',()=>{
  assert.ok(!index.includes('href="tradeoff.html"'));
  assert.ok(index.includes('href="damage.html"'));
  assert.ok(analyzer.includes('href="tradeoff.html"'));
  assert.ok(html.includes('src="combat-model.js"'));
  assert.ok(html.includes('src="tradeoff-model.js"'));
  assert.match(html,/<select id="map">/);
  assert.match(html,/<select id="monster">/);
  for(const metric of ['pierce','atk','critd','crit','hit','dex']){
    assert.ok(html.includes('id="'+metric+'A"'),metric+'A');
    assert.ok(html.includes('id="'+metric+'B"'),metric+'B');
  }
  assert.ok(html.includes('id="panelatk"')&&html.includes('id="dexrate"'));
  assert.ok(html.includes('id="observed"'));
  assert.ok(html.includes('id="results"'));
  assert.doesNotThrow(()=>new Function(script));
});
test('comparison deliberately has no map averages and no guessed DEX damage ratios',()=>{
  assert.match(html,/不提供地圖平均值/);
  assert.match(html,/條件式/);
  assert.match(html,/DEX.*校準/);
  assert.match(html,/ATK%.*尚待/);
  assert.doesNotMatch(html,/EXP\/h.*估算結果/);
});
