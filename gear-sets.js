/* LumiDex manually selected official Gear Sets.
   Explorer does not expose gear set membership. Never infer from item name/tier.
   Source: https://www.lumivaraonline.com/wiki/ — Refine & Gear Systems > Gear Sets.
*/
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LumiGearSets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const catalog=Object.freeze([
    {id:'warlord',name:'戰神（Warlord）',rarity:'普通',threshold:2,stackable:true,effect:'ATK +10%／每 2 件可疊加，最多 3 層',bonus:{atkPct:10}},
    {id:'archmage',name:'大法師（Archmage）',rarity:'普通',threshold:2,stackable:true,effect:'MATK +10%／每 2 件可疊加，最多 3 層',bonus:{matkPct:10}},
    {id:'phantom_dancer',name:'幻影舞者（Phantom Dancer）',rarity:'普通',threshold:4,effect:'FLEE +200、ATK +10%、移動速度 +7%',bonus:{flee:200,atkPct:10,movePct:7}},
    {id:'hawkeye',name:'鷹眼（Hawkeye）',rarity:'普通',threshold:4,effect:'HIT +250、ATK +10%、MATK +10%、移動速度 +7%',bonus:{hit:250,atkPct:10,matkPct:10,movePct:7}},
    {id:'mystic_sage',name:'秘法賢者（Mystic Sage）',rarity:'普通',threshold:4,effect:'DEX +30、MATK +10%、SP 恢復 +5、移動速度 +7%',bonus:{dex:30,matkPct:10,spRegen:5,movePct:7}},
    {id:'lucky_star',name:'幸運之星（Lucky Star）',rarity:'稀有',threshold:2,stackable:true,effect:'CRIT 點數 +10／每 2 件可疊加，最多 3 層',bonus:{crit:10}},
    {id:'iron_bastion',name:'鋼鐵堡壘（Iron Bastion）',rarity:'稀有',threshold:2,stackable:true,effect:'HP +500、DEF +7、MDEF +10／每 2 件可疊加',bonus:{hp:500,def:7,mdef:10}},
    {id:'blood_lord',name:'鮮血領主（Blood Lord）',rarity:'稀有',threshold:6,effect:'每次命中吸血＝造成傷害的 100%（單次最多 MaxHP 5%）、消耗 MaxSP 3%、負重 +2000、造成傷害 −30%',bonus:{lifesteal:true,spDrainPct:3,carry:2000,damageMultiplier:0.7}},
    {id:'executioner',name:'處刑者（Executioner）',rarity:'傳說',threshold:2,stackable:true,effect:'爆擊傷害 +15%／每 2 件可疊加，最多 3 層',bonus:{critDmg:15}},
    {id:'armor_breaker',name:'破甲者（Armor Breaker）',rarity:'傳說',threshold:2,stackable:true,effect:'物理穿透 +7%／每 2 件可疊加，最多 3 層',bonus:{pierce:7}},
    {id:'spellbreaker',name:'破魔者（Spellbreaker）',rarity:'傳說',threshold:2,stackable:true,effect:'魔法穿透 +7%／每 2 件可疊加，最多 3 層',bonus:{magicPierce:7}}
  ]);
  const byId=Object.freeze(Object.fromEntries(catalog.map(x=>[x.id,x])));
  const numberFields=['atkPct','matkPct','flee','movePct','hit','dex','spRegen','crit','hp','def','mdef','carry','critDmg','pierce','magicPierce','spDrainPct'];
  const labels=Object.freeze({atkPct:'ATK%',matkPct:'MATK%',flee:'FLEE',movePct:'移動速度',hit:'HIT',dex:'DEX',spRegen:'SP 恢復',crit:'CRIT 點數',hp:'HP',def:'DEF',mdef:'MDEF',carry:'負重',critDmg:'爆擊傷害',pierce:'物理穿透',magicPierce:'魔法穿透',spDrainPct:'每次命中 SP 消耗'});
  const percentFields=new Set(['atkPct','matkPct','movePct','critDmg','pierce','magicPierce','spDrainPct']);
  function calculate(rows){
    if(!Array.isArray(rows)||rows.length>6)throw new RangeError('套裝選擇最多六組');
    const used=new Set(),active=[],inactive=[];
    const bonuses=Object.fromEntries(numberFields.map(k=>[k,0]));
    let totalPieces=0,damageMultiplier=1;
    for(const row of rows){
      const set=typeof row?.id==='string'&&Object.hasOwn(byId,row.id)?byId[row.id]:null,count=row?.count;
      if(!set)throw new RangeError('未知的套裝');
      if(used.has(set.id))throw new RangeError('同一套裝請合併件數');
      if(!Number.isInteger(count)||count<1||count>6)throw new RangeError('套裝件數必須為 1～6 件');
      used.add(set.id);totalPieces+=count;
      const stacks=count>=set.threshold?(set.stackable?Math.min(3,Math.floor(count/set.threshold)):1):0;
      const entry={id:set.id,name:set.name,rarity:set.rarity,count,threshold:set.threshold,stacks,stackable:!!set.stackable,effect:set.effect};
      if(!stacks){inactive.push(entry);continue;}
      active.push(entry);
      for(const key of numberFields)bonuses[key]+=(set.bonus[key]||0)*stacks;
      if(set.bonus.damageMultiplier)damageMultiplier*=set.bonus.damageMultiplier;
    }
    if(totalPieces>6)throw new RangeError('套裝只能穿在六個防具部位，合計不得超過 6 件');
    const effectSummary=numberFields.filter(k=>bonuses[k]!==0).map(k=>labels[k]+' +'+bonuses[k]+(percentFields.has(k)?'%':''));
    if(active.some(x=>x.id==='blood_lord')){
      effectSummary.push('傷害 −30%','每次命中吸血＝造成傷害的 100%（上限 MaxHP 5%）');
    }
    return {totalPieces,active,inactive,bonuses,damageMultiplier,effectSummary};
  }
  function apply(build,summary){
    if(!build||!summary||!['physical','magic'].includes(build.attackType))throw new RangeError('Invalid set comparison build');
    const b=summary.bonuses,physical=build.attackType==='physical';
    return {
      ...build,
      attackBonusPct:build.attackBonusPct+(physical?b.atkPct:b.matkPct),
      pierce:build.pierce+(physical?b.pierce:b.magicPierce),
      critDamageBonus:build.critDamageBonus+b.critDmg,
      hit:build.hit+b.hit,
      dex:build.dex+b.dex
      // Raw CRIT points cannot be converted into actual skill crit chance.
      // FLEE, player DEF, HP, movement and recovery are not per-hit damage.
    };
  }
  function describe(entry){
    if(!entry.stacks)return entry.name+' '+entry.count+'/'+entry.threshold+' 件（尚未啟動）';
    return entry.name+' '+entry.count+' 件（'+(entry.stackable?'已啟動 ×'+entry.stacks:'已啟動')+'）：'+entry.effect;
  }
  return Object.freeze({catalog,byId,calculate,apply,describe});
});
