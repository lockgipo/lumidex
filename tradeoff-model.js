/* LumiDex v0.8 experimental attribute exchange model.
 * Verified: armor/pierce, HIT/FLEE, critical 2x + critical-damage bonus.
 * Explicit assumption: total ATK%/MATK% bonus adds within one multiplier pool.
 * DEX has NO universal conversion: require user-measured panel ATK / MATK sensitivity.
 * No global DPS or EXP/hr projections.
 */
(function(root,factory){
  const combat=typeof module==='object'&&module.exports?require('./combat-model.js'):root.LumiCombat;
  const api=factory(combat);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LumiTradeoff=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Combat){
  'use strict';
  if(!Combat)throw new Error('combat-model.js must load before tradeoff-model.js');
  const finite=(v,name)=>{
    if(typeof v!=='number'||!Number.isFinite(v)||v<0)throw new RangeError(name+' must be a finite nonnegative number');
    return v;
  };
  const positive=(v,name)=>{
    if(finite(v,name)<=0)throw new RangeError(name+' must be positive');
    return v;
  };
  const percent=(v,name)=>{
    if(finite(v,name)>100)throw new RangeError(name+' must be at most 100');
    return v;
  };
  const critAverage=(rate,bonus,enabled)=>enabled?1+(percent(rate,'critChance')/100)*(1+finite(bonus,'critDamageBonus')/100):1;
  function checkedBuild(b){
    if(!b||!['physical','magic'].includes(b.attackType))throw new RangeError('attackType must be physical or magic');
    return {
      attackType:b.attackType,pierce:finite(b.pierce,'pierce'),
      hit:finite(b.hit,'hit'),dex:finite(b.dex,'dex'),
      attackBonusPct:finite(b.attackBonusPct,'attackBonusPct'),
      critChance:percent(b.critChance,'critChance'),
      critDamageBonus:finite(b.critDamageBonus,'critDamageBonus')
    };
  }
  function compare(monster,original,candidate,options={}){
    if(!monster)throw new TypeError('monster is required');
    const A=checkedBuild(original),B=checkedBuild(candidate);
    if(A.attackType!==B.attackType)throw new RangeError('attackType must match for A and B');
    const defense=finite(monster[A.attackType==='physical'?'def':'mdef'],'monster defense');
    const flee=finite(monster.flee,'monster flee'),hp=positive(monster.hp,'monster hp');
    const guaranteedHit=options.guaranteedHit===true;
    const canCrit=options.skillCanCrit!==false;
    const hitChanceA=guaranteedHit?1:Combat.hitChance(A.hit,flee);
    const hitChanceB=guaranteedHit?1:Combat.hitChance(B.hit,flee);
    const armorA=Combat.armorMultiplier(defense,A.pierce);
    const armorB=Combat.armorMultiplier(defense,B.pierce);
    const critFactorA=critAverage(A.critChance,A.critDamageBonus,canCrit);
    const critFactorB=critAverage(B.critChance,B.critDamageBonus,canCrit);
    const missing=[],assumptions=[];
    let dexRatio=1;
    if(A.dex!==B.dex){
      if(options.panelAttack==null||options.attackPerDex==null){
        dexRatio=null;
        missing.push('DEX 變動尚未校準：請輸入目前面板 ATK／MATK 與每 +1 DEX 實測造成的面板變化；也需另外調整 HIT。');
      }else{
        const panelAttack=positive(options.panelAttack,'panelAttack');
        // If switching classes/passives or changing gear affects DEX conversion, this remains only a what-if sensitivity.
        const attackPerDex=finite(options.attackPerDex,'attackPerDex');
        const predicted=panelAttack+(B.dex-A.dex)*attackPerDex;
        if(predicted<=0)throw new RangeError('predicted panel attack must be positive');
        dexRatio=predicted/panelAttack;
        assumptions.push('DEX 的攻擊轉換由使用者實測面板靈敏度近似；未包含職業技能、攻速、詠唱時間或被動技能門檻變化。');
      }
    }
    const bonusRatio=(1+B.attackBonusPct/100)/(1+A.attackBonusPct/100);
    if(A.attackBonusPct!==B.attackBonusPct){
      assumptions.push('ATK%／MATK% 假定同乘區加總、其他加成不變；官方尚未完整驗證此堆疊方式。');
    }
    const attackRatio=dexRatio===null?null:dexRatio*bonusRatio;
    const factors={
      armor:armorB/armorA,
      attack:attackRatio,
      attackBonus:bonusRatio,
      dex:dexRatio,
      crit:critFactorB/critFactorA,
      hit:hitChanceB/hitChanceA
    };
    const complete=missing.length===0;
    const totalRatio=complete?factors.armor*factors.attack*factors.crit*factors.hit:null;
    const observed=options.observedNoncrit==null?null:positive(options.observedNoncrit,'observedNoncrit');
    const normalDamageA=observed;
    const normalDamageB=observed!=null&&complete?observed*factors.armor*factors.attack:null;
    const critMultA=canCrit?2+A.critDamageBonus/100:1;
    const critMultB=canCrit?2+B.critDamageBonus/100:1;
    return Object.freeze({
      complete,missing,assumptions,factors,totalRatio,
      hitChanceA,hitChanceB,critFactorA,critFactorB,
      normalDamageA,normalDamageB,
      critDamageA:observed!=null&&canCrit?observed*critMultA:null,
      critDamageB:normalDamageB!=null&&canCrit?normalDamageB*critMultB:null,
      expectedPerAttemptA:observed!=null?observed*critFactorA*hitChanceA:null,
      expectedPerAttemptB:normalDamageB!=null?normalDamageB*critFactorB*hitChanceB:null,
      hitsNormalA:observed!=null?Combat.hitsToKill(hp,observed):null,
      hitsNormalB:normalDamageB!=null?Combat.hitsToKill(hp,normalDamageB):null,
      // A critical proc or a miss changes the number of actions needed; never label this as guaranteed hits.
      monsterHp:hp,defense,armorA,armorB
    });
  }
  return Object.freeze({compare,critAverage});
});
