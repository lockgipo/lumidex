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

test('v0.4 UI retains v0.3 verified game dataset', () => {
  assert.equal(data.meta.version, '0.3.0');
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

test('market pricing is local, region-specific, and never fabricates a price', () => {
  assert.ok(html.includes('id="market-region"'));
  assert.ok(app.includes('lumidex-v04-market'));
  assert.ok(app.includes("marketRegion+'|'+id"));
  assert.ok(app.includes("source:'manual'"));
  assert.ok(app.includes("r.source==='manual'"));
  assert.ok(app.includes("marketValue(r,'lowestAsk')"));
  assert.ok(app.includes("marketValue(r,'avg7Sold')"));
  assert.ok(app.includes("return r&&validMarketPrice(r[key])?fmtSilver(r[key]):'—'"));
  assert.ok(app.includes('個人記錄、非即時行情'));
  assert.ok(app.includes('儲存失敗'));
});

test('materials keep NPC value and drop rate without per-100 expectation', () => {
  assert.ok(html.includes('NPC 收購單價'));
  assert.ok(html.includes('m.dropRate'));
  assert.ok(!html.includes('materialYield('));
  assert.ok(!html.includes('每 100 隻預期'));
  assert.ok(!html.includes('每 100 隻預期材料收益'));
});
