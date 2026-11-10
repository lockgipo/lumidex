/* LumiDex quick gear gain model v0.8.5.
 * Official Wiki verified: each 3 DEF/MDEF cuts 1% (max 255/85%);
 * pierce subtracts the reduction percentage (including crits);
 * a landed critical is 2x + extra crit damage.
 * NOT verified: all ATK%/MATK% share one additive multiplier pool,
 * nor whether displayed ATK can be algebraically decomposed into that pool.
 * A and B are NET differences from the currently equipped character panel.
 * Never model crit chance, HIT chance, skill damage, elemental effects or DPS.
 */
(function(root,factory){
 const combat=typeof module==='object'&&module.exports?require('./combat-model.js'):root.LumiCombat;
 const api=factory(combat);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.LumiDamage=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Combat){
 'use strict';
 if(!Combat)throw new Error('combat-model.js is required');
 function num(n,name,{negative=false}={}){
   if(typeof n!=='number'||!Number.isFinite(n)||(!negative&&n<0))throw new RangeError(name+' must be a finite '+(negative?'number':'nonnegative number'));
   return n;
 }
 function armor(defense,pierce){
   return Combat.armorMultiplier(num(defense,'defense'),num(pierce,'pierce'));
 }
 function baseline(raw){
   if(!raw)throw new TypeError('current panel is required');
   return {
     pierce:num(raw.pierce,'base pierce'),
     attackPct:num(raw.attackPct,'base ATK%/MATK%'),
     critDamagePct:num(raw.critDamagePct,'base crit damage')
   };
 }
 function delta(raw,name){
   if(!raw)throw new TypeError(name+' gear delta is required');
   return {
     pierce:num(raw.pierce??0,name+' pierce delta',{negative:true}),
     attackPct:num(raw.attackPct??0,name+' attack bonus delta',{negative:true}),
     critDamagePct:num(raw.critDamagePct??0,name+' crit damage delta',{negative:true}),
     flatAttack:num(raw.flatAttack??0,name+' flat attack delta',{negative:true})
   };
 }
 function compare(options){
   if(!options)throw new TypeError('options are required');
   const defense=num(options.defense,'defense');
   const base=baseline(options.base),a=delta(options.a,'A'),b=delta(options.b,'B');
   const missing=[],assumptions=[];
   const currentArmor=armor(defense,base.pierce);
   const baseAttackPool=1+base.attackPct/100;
   const baseCritMultiplier=2+base.critDamagePct/100;
   const needsFlat=a.flatAttack!==0||b.flatAttack!==0;
   const hasPanel=options.panelAttack!==undefined&&options.panelAttack!==null;
   let prePoolAttack=null;
   if(hasPanel){
     const panelAttack=num(options.panelAttack,'panel ATK/MATK');
     if(panelAttack<=0)throw new RangeError('panel ATK/MATK must be positive');
     prePoolAttack=panelAttack/baseAttackPool;
   }else if(needsFlat){
     missing.push('含固定 ATK／MATK 或主屬性變化時，請填入目前面板 ATK／MATK；否則無法可信地比較。');
   }
   const attackPctChanged=a.attackPct!==0||b.attackPct!==0;
   if(attackPctChanged){
     assumptions.push('ATK%／MATK% 暫假設全部在同一加算乘區；此部分待實測，不能視為官方已驗證。');
   }
   if(needsFlat){
     assumptions.push('固定 ATK／MATK 的推算假設目前面板攻擊力 = 未加成攻擊力 ×（1＋總 ATK%／MATK%）；面板拆解與乘區順序尚待實測。');
   }
   const calc=(d,name)=>{
     const updatedPierce=base.pierce+d.pierce;
     const updatedPct=base.attackPct+d.attackPct;
     const updatedCrit=base.critDamagePct+d.critDamagePct;
     for(const [key,val] of [['pierce',updatedPierce],['ATK%/MATK%',updatedPct],['critical damage',updatedCrit]]){
       if(!Number.isFinite(val)||val<0)throw new RangeError(name+' resulting '+key+' must be nonnegative');
     }
     const defenseFactor=armor(defense,updatedPierce);
     const bonusFactor=(1+updatedPct/100)/baseAttackPool;
     const attackFactor=prePoolAttack!==null
       ?bonusFactor*(prePoolAttack+d.flatAttack)/prePoolAttack
       :bonusFactor;
     if(prePoolAttack!==null&&prePoolAttack+d.flatAttack<=0)throw new RangeError(name+' predicted attack must be positive');
     const noncrit=missing.length?null:attackFactor*(defenseFactor/currentArmor);
     const crit=noncrit===null?null:noncrit*(2+updatedCrit/100)/baseCritMultiplier;
     return Object.freeze({
       pierce:updatedPierce,attackPct:updatedPct,critDamagePct:updatedCrit,
       armor:defenseFactor,attackFactor,noncrit,crit
     });
   };
   const A=calc(a,'A'),B=calc(b,'B');
   const complete=missing.length===0;
   return Object.freeze({
     complete,missing,assumptions,A,B,defense,currentArmor,
     proven:Object.freeze({armor:true,critical:true,atkStacking:false,flatAtkConversion:false}),
     relative:Object.freeze({BvsA:Object.freeze({
       noncrit:complete?B.noncrit/A.noncrit:null,
       crit:complete?B.crit/A.crit:null
     })})
   });
 }
 return Object.freeze({armor,compare});
});
