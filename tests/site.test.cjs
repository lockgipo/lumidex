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

test('v0.5 UI retains the verified game dataset', () => {
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

test('market file import updates only older asks in the selected region', async () => {
  const [priced, unlisted, newer, unknown] = data.cards.map(card => card.id);
  const storageKey = 'lumidex-v04-market';
  const recent = { lowestAsk: 8000, updatedAt: '2026-11-08T02:00:00Z', source: 'manual' };
  const original = {
    ['SEA|' + priced]: { lowestAsk: 900, avg7Sold: 1200, updatedAt: '2026-11-08T00:00:00Z', source: 'manual' },
    ['SEA|' + newer]: recent,
    ['EU|' + priced]: recent,
  };
  const storage = new Map([[storageKey, JSON.stringify(original)]]);
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const el = {
        firstChild: {},
        classList: { toggle() {}, remove() {} },
        listeners: {},
        addEventListener(type, handler) { this.listeners[type] = handler; },
        appendChild() {},
        querySelectorAll() { return []; },
        closest() { return this; },
      };
      elements.set(id, el);
    }
    return elements.get(id);
  }
  const context = vm.createContext({
    document: {
      body: { style: {} },
      getElementById: () => ({ textContent: JSON.stringify(data) }),
      querySelector: element,
      querySelectorAll: () => [],
      createElement: () => ({}),
      addEventListener() {},
    },
    window: { addEventListener() {} },
    location: { hash: '' },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'market-snapshot.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'card-filters.js'), 'utf8'), context);
  vm.runInContext(app, context);
  const snapshot = {
    version: 1, source: 'manual', currency: 'Silver', region: 'SEA',
    startedAt: '2026-11-08T01:00:00Z', finishedAt: '2026-11-08T01:05:00Z',
    cards: [
      { cardId: priced, lowestAsk: 1100 },
      { cardId: unlisted, lowestAsk: null },
      { cardId: newer, lowestAsk: 7000 },
    ],
  };
  const input = element('#market-file');
  async function importSnapshot(batch) {
    input.files = [{ text: async () => '\uFEFF' + JSON.stringify(batch) }];
    await input.listeners.change({ target: input });
    assert.equal(input.disabled, false);
    assert.equal(input.value, '');
    return element('#market-import-status').textContent;
  }
  assert.match(await importSnapshot({ ...snapshot, region: 'EU' }), /切換到 EU/);
  assert.match(await importSnapshot({ ...snapshot, cards: [...snapshot.cards, { cardId: 'unknown', lowestAsk: 1 }] }), /無法對應/);
  assert.deepEqual(JSON.parse(storage.get(storageKey)), original);

  assert.match(await importSnapshot(snapshot), /更新 2 張.*查核 3\/88 張/);
  const saved = JSON.parse(storage.get(storageKey));
  assert.equal(saved['SEA|' + priced].lowestAsk, 1100);
  assert.equal(saved['SEA|' + priced].avg7Sold, 1200);
  assert.equal(saved['SEA|' + priced].askObservedAt, '2026-11-08T01:05:00.000Z');
  assert.equal(saved['SEA|' + unlisted].noListings, true);
  assert.equal(saved['SEA|' + unknown], undefined);
  assert.deepEqual(saved['SEA|' + newer], recent);
  assert.deepEqual(saved['EU|' + priced], recent);
  assert.match(element('#results').innerHTML, /最低掛賣 1,100 Silver/);
  assert.match(element('#results').innerHTML, /當時無掛單/);
  assert.match(await importSnapshot(snapshot), /更新 0 張/);
  assert.deepEqual(JSON.parse(storage.get(storageKey)), saved);
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
