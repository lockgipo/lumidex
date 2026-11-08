const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { cards } = require('../data.json');

const script = path.join(__dirname, '../scripts/record-market-snapshot.cjs');
const sample = {
  version: 1,
  source: 'manual',
  currency: 'Silver',
  region: 'SEA',
  startedAt: '2026-11-08T01:00:00Z',
  finishedAt: '2026-11-08T01:05:00Z',
  cards: [
    { cardId: cards[0].id, lowestAsk: 1234 },
    { cardId: cards[1].id, lowestAsk: null },
  ],
};

function workspace(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lumidex-market-'));
  const input = path.join(directory, 'input.json');
  const history = path.join(directory, 'history');
  t.after(() => {
    if (fs.existsSync(history)) {
      for (const entry of fs.readdirSync(history)) fs.unlinkSync(path.join(history, entry));
      fs.rmdirSync(history);
    }
    fs.rmSync(input, { force: true });
    fs.rmdirSync(directory);
  });
  return {
    history,
    record(snapshot) {
      fs.writeFileSync(input, '\uFEFF' + JSON.stringify(snapshot));
      return spawnSync(process.execPath, [script, input, history], { encoding: 'utf8' });
    },
  };
}

test('archives a partial batch without treating unchecked cards as unlisted', t => {
  const { record, history } = workspace(t);
  const result = record(sample);
  assert.equal(result.status, 0, result.stderr);
  const entries = fs.readdirSync(history);
  assert.equal(entries.length, 1);
  const saved = JSON.parse(fs.readFileSync(path.join(history, entries[0]), 'utf8'));
  assert.deepEqual(saved.coverage, { priced: 1, noListings: 1, unobserved: cards.length - 2, total: cards.length });
  assert.equal(saved.startedAt, '2026-11-08T01:00:00.000Z');
  assert.equal(saved.currency, 'Silver');
  assert.deepEqual(saved.cards.find(row => row.cardId === cards[1].id), sample.cards[1]);
});

test('checks all catalog cards and preserves separate time and region samples', t => {
  const { record, history } = workspace(t);
  const all = { ...sample, cards: cards.map(card => ({ cardId: card.id, lowestAsk: 42 })) };
  for (const snapshot of [all, { ...all, region: 'East Asia' }, { ...all, finishedAt: '2026-11-08T01:06:00Z' }]) {
    const result = record(snapshot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /88\/88/);
  }
  assert.equal(fs.readdirSync(history).length, 3);
});

test('rejects invalid, duplicate, or unidentifiable observations before saving', t => {
  const { record, history } = workspace(t);
  const [first] = sample.cards;
  for (const invalid of [
    { currency: 'Gold' },
    { region: 'CH85' },
    { startedAt: '2026-11-31T00:00:00Z' },
    { startedAt: '2026-11-08T02:00:00Z' },
    { cards: [{ ...first, cardId: 'unknown' }] },
    { cards: [{ cardId: first.cardId }] },
    { cards: [{ ...first, lowestAsk: 0 }] },
    { cards: [first, first] },
  ]) {
    const result = record({ ...sample, ...invalid });
    assert.equal(result.status, 1, JSON.stringify(invalid));
  }
  assert.equal(fs.existsSync(history), false);
});

test('identical retries are safe and conflicting retries preserve the original', t => {
  const { record, history } = workspace(t);
  assert.equal(record(sample).status, 0);
  assert.equal(record({ ...sample, cards: [...sample.cards].reverse() }).status, 0);
  const entries = fs.readdirSync(history);
  assert.equal(entries.length, 1);
  const filename = path.join(history, entries[0]);
  const original = fs.readFileSync(filename, 'utf8');
  const result = record({ ...sample, cards: [{ ...sample.cards[0], lowestAsk: 5000 }] });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /既有紀錄已保留/);
  assert.equal(fs.readFileSync(filename, 'utf8'), original);
  assert.deepEqual(fs.readdirSync(history), entries);
});
