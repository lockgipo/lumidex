/* LumiDex combat math v0.6 - official Wiki verified subset.
 * Physical/magic armor reduction, pierce and HIT/FLEE only.
 * Does not estimate attack speed, skills, elemental bonuses, critical hits, or EXP/hour.
 * Every input is a finite nonnegative stat, percentages use percentage points.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LumiCombat = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function stat(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new RangeError(name + ' must be a finite nonnegative number');
    return value;
  }
  const clamp = (n,lo,hi) => Math.max(lo, Math.min(hi, n));
  // Official Wiki: each 3 DEF/MDEF reduces damage by 1 percentage point, capped at 85%.
  function armorMultiplier(defense, piercePercent) {
    const reduction = Math.min(255, stat(defense,'defense')) / 300;
    const pierce = stat(piercePercent,'piercePercent') / 100;
    return clamp(1 - Math.max(0, reduction - pierce), 0, 1);
  }
  // Official Wiki: HIT >= FLEE guarantees a hit; otherwise -0.25% per point; floor 40%.
  function hitChance(hit, flee) {
    return clamp(1 + (stat(hit,'hit') - stat(flee,'flee')) * 0.0025, 0.4, 1);
  }
  function hitsToKill(hp, onHitDamage) {
    if (hp == null || onHitDamage == null) return null;
    if (stat(hp,'hp') <= 0 || stat(onHitDamage,'onHitDamage') <= 0) return null;
    return Math.ceil(hp / onHitDamage);
  }
  function damageNeededPerHit(hp, numberOfHits) {
    if (hp == null || numberOfHits == null) return null;
    if (stat(hp,'hp') <= 0 || !Number.isSafeInteger(numberOfHits) || numberOfHits <= 0) return null;
    return Math.ceil(hp / numberOfHits);
  }
  function analyze(monster, build) {
    if (!monster || !build) throw new TypeError('Monster and build are required');
    if (!['physical','magic'].includes(build.attackType)) throw new RangeError('attackType must be physical or magic');
    const defense = stat(monster[build.attackType==='physical'?'def':'mdef'],'monster defense');
    const flee = stat(monster.flee,'monster flee');
    const pierce = stat(build.pierce,'pierce');
    const added = stat(build.pierceIncrease ?? 0,'pierceIncrease');
    const chance = build.alwaysHits===true ? 1 : hitChance(stat(build.hit,'hit'),flee);
    const armorBefore = armorMultiplier(defense,pierce);
    const armorAfter = armorMultiplier(defense,pierce+added);
    const damageGainPct = (armorAfter / armorBefore - 1) * 100;
    const raw = build.rawDamage == null ? null : stat(build.rawDamage,'rawDamage');
    const before = raw === null ? null : raw * armorBefore;
    const after = raw === null ? null : raw * armorAfter;
    return {
      armorBefore, armorAfter, hitChance:chance, damageGainPct,
      expectedOnHitBefore: before, expectedOnHitAfter: after,
      expectedPerAttemptBefore: before === null ? null : before*chance,
      expectedPerAttemptAfter: after === null ? null : after*chance,
      hitsToKill: chance === 1 ? hitsToKill(monster.hp,before) : null,
      hitsToKillAfter: chance === 1 ? hitsToKill(monster.hp,after) : null,
      // When the character can miss, the count is NOT guaranteed and must not be displayed.
      damageNeededForTwoHits: damageNeededPerHit(monster.hp,2)
    };
  }
  return Object.freeze({armorMultiplier,hitChance,hitsToKill,damageNeededPerHit,analyze});
});
