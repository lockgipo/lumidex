const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const app = scripts.at(-1)[1];

test('catalog retains the verified game dataset', () => {
  assert.equal(data.meta.version, '0.3.1');
  assert.deepEqual([data.cards.length, data.monsters.length, data.maps.length, data.materials.length], [88, 90, 18, 72]);
  assert.deepEqual(JSON.parse(html.match(/<script id="db" type="application\/json">([\s\S]*?)<\/script>/)[1]), data);
  assert.ok(data.cards.every(c => c.slotList?.length && c.npcSell != null));
  assert.ok(data.materials.every(m => m.dropRate === 30 && m.npcSell >= 0 && data.monsters.some(x => x.id === m.sourceMonster)));
  assert.equal(data.cards.filter(c => c.verifiedDrops.length).length, 72);
  assert.equal(data.cards.filter(c => c.specialDrop).length, 2);
  assert.ok(html.includes('lumidex-v1-'));
  assert.ok(html.includes('id="slotfilter"'));
  assert.ok(html.includes('data-nav="materials"'));
  assert.doesNotThrow(() => new vm.Script(app));
});

test('materials keep NPC value and drop rate without per-100 expectation', () => {
  assert.ok(html.includes('NPC 收購單價'));
  assert.ok(html.includes('m.dropRate'));
  assert.ok(!html.includes('materialYield('));
  assert.ok(!html.includes('每 100 隻預期'));
  assert.ok(!html.includes('每 100 隻預期材料收益'));
});

test('special cards have verified Traditional Chinese mechanics instead of placeholders', () => {
  const special = data.cards.filter(card => card.special);
  assert.equal(special.length, 22);
  assert.ok(special.every(card =>
    card.wiki.startsWith('https://lumivaraonline.com/wiki/cards/')
    && card.effect.length > 18
    && !card.effect.includes('效果詳見官方 Wiki')
  ));
  const byId = new Map(special.map(card => [card.id, card]));
  assert.match(byId.get('card-kasa-obake').effect, /魔法傷害.*20%/);
  assert.match(byId.get('card-star-raider').effect, /85%.*12%.*120 px.*10%/);
  assert.match(byId.get('card-lunar-oracle').effect, /MaxSP.*2%.*3 張/);
  assert.match(byId.get('card-terragorn').effect, /150 px.*6.*40%.*HIT/);
  assert.ok(app.includes('特殊技能卡通用限制'));
  assert.ok(app.includes('官方機制名稱'));
});

test('mobile layout prioritizes compact summary, search and card results',()=>{
  const header=html.indexOf('<header class="head">');
  const summary=html.indexOf('<div class="summary"');
  const search=html.indexOf('<div class="searchbox">');
  const effects=html.indexOf('<details class="effect-filters"');
  const results=html.indexOf('<div class="results"');
  assert.ok(header>0&&header<summary&&summary<search&&search<effects&&effects<results);
  assert.match(html,/<details class="tools" id="tools">[\s\S]*?<select id="lang"/);
  assert.match(html,/<a class="tool-link" href="damage.html">/);
  assert.doesNotMatch(html,/<a class="tool-link" href="analyzer.html">/);
  assert.match(html,/<details class="advanced-filters" id="advanced-filters">/);
  assert.match(html,/<button type="button" class="reset-advanced" id="reset-advanced">/);
  assert.match(html,/@media\(max-width:850px\)[\s\S]*?grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.ok(['c-card','c-mon','c-map','c-mat'].every(id=>html.includes('id="'+id+'"')));
  assert.ok(!html.includes('id="chips"'));
  assert.ok(!app.includes("$('#chips')"));
  assert.ok(html.includes('data-effect-group')&&html.includes('data-effect-option'));
  assert.equal((html.match(/data-nav="/g)||[]).length,10);
  assert.match(html,/<nav class="mobnav"[\s\S]*?<svg viewBox="0 0 24 24"/);
  assert.ok(html.includes('v0.6.4'));
});
