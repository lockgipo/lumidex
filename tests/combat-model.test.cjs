const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const db = require('../data.json');
const stats = require('../monster-stats.json');
const Combat = require('../combat-model.js');

test('official combat snapshot covers all 90 indexed monsters without altering IDs', () => {
  assert.equal(stats.meta.count, 90);
  assert.deepEqual(Object.keys(stats.monsters), db.monsters.map(m => m.id));
  for (const monster of db.monsters) {
    const row = stats.monsters[monster.id];
    assert.ok(row, monster.id);
    for (const key of ['hp','atk','matk','def','mdef','flee','hit','exp']) {
      assert.ok(Number.isSafeInteger(row[key]) && row[key] >= 0, monster.id + ' ' + key);
    }
    assert.ok(row.hp > 0 && row.wiki.startsWith('https://www.lumivaraonline.com/wiki/monsters/'));
    assert.ok(row.element);
  }
  assert.deepEqual(
    {hp: stats.monsters['monster-amethyst-wyvern'].hp,def:stats.monsters['monster-amethyst-wyvern'].def,mdef:stats.monsters['monster-amethyst-wyvern'].mdef,flee:stats.monsters['monster-amethyst-wyvern'].flee},
    {hp:254142,def:225,mdef:225,flee:360}
  );
});

test('armor formula compares pierce by percentage-points using the correct defense type', () => {
  assert.ok(Math.abs(Combat.armorMultiplier(225,35) - 0.6) < 1e-12);
  assert.ok(Math.abs(Combat.armorMultiplier(225,45) - 0.7) < 1e-12);
  assert.ok(Math.abs(Combat.armorMultiplier(255,0)-0.15)<1e-12);
  assert.equal(Combat.armorMultiplier(255,150),1);
  assert.equal(Combat.armorMultiplier(0,30),1);
  const result=Combat.analyze({def:225,mdef:90,flee:360,hp:254142},{attackType:'physical',hit:360,pierce:35,pierceIncrease:10});
  assert.ok(Math.abs(result.damageGainPct - 16.666666666667) < 1e-8);
  assert.equal(result.armorBefore,0.6);
  assert.equal(result.armorAfter,0.7);
  const magical=Combat.analyze({def:225,mdef:90,flee:360,hp:254142},{attackType:'magic',hit:360,pierce:35,pierceIncrease:10});
  assert.ok(Math.abs(magical.armorBefore-1)<1e-12); // 90 DEF = 30%, 35% magic pierce negates it
  assert.equal(magical.damageGainPct,0);
});

test('HIT/FLEE is bounded, with a separate guaranteed-hit condition', () => {
  assert.equal(Combat.hitChance(360,360),1);
  assert.equal(Combat.hitChance(320,360),0.9);
  assert.equal(Combat.hitChance(0,500),0.4);
  assert.equal(Combat.hitChance(600,500),1);
  const result=Combat.analyze({def:225,mdef:225,flee:360,hp:254142},{attackType:'physical',hit:320,pierce:35,pierceIncrease:10,rawDamage:100000});
  assert.equal(result.hitChance,0.9);
  assert.equal(result.hitsToKill,null); // miss chance prevents deterministic count
  assert.ok(result.expectedOnHitAfter > result.expectedOnHitBefore);
});

test('kill threshold only uses verified on-hit damage; invalid inputs fail closed', () => {
  assert.equal(Combat.hitsToKill(254142,100000),3);
  assert.equal(Combat.hitsToKill(254142,128000),2);
  assert.equal(Combat.damageNeededPerHit(254142,2),127071);
  assert.equal(Combat.hitsToKill(254142,null),null);
  assert.equal(Combat.damageNeededPerHit(null,2),null);
  assert.throws(()=>Combat.armorMultiplier(225,-1));
  assert.throws(()=>Combat.hitChance(-1,90));
  assert.throws(()=>Combat.analyze({def:225,mdef:225,flee:360,hp:254142},{attackType:'unknown',hit:360,pierce:35,pierceIncrease:10}));
});
