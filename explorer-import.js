/* LumiDex Explorer gear importer. Pure data transform; no network requests or personal records saved. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LumiExplorerImport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const knownBonuses=Object.freeze({
    str:'STR',agi:'AGI',vit:'VIT',int:'INT',dex:'DEX',luk:'LUK',
    atk:'ATK（固定值）',matk:'MATK（固定值）',atkPct:'ATK%',matkPct:'MATK%',
    def:'DEF',mdef:'MDEF',hit:'HIT',flee:'FLEE',crit:'CRIT 點數',mcrit:'MCRIT 點數',
    critDmg:'爆擊傷害',pierce:'物理穿透',magicPierce:'魔法穿透',
    crushHit:'破甲攻擊',spRegen:'SP 恢復',hpRegen:'HP 恢復',
    resBleed:'流血抗性',resStun:'暈眩抗性',resPoison:'中毒抗性'
  });
  const percentage=new Set(['atkPct','matkPct','critDmg','pierce','magicPierce','crushHit']);
  const trim=(value,max=90)=>String(value==null?'':value).slice(0,max).trim();
  const validName=s=>s.length>0&&s.length<=24&&!/[<>\x00-\x1f]/.test(s);
  function sanitizeGear(raw,source,index){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
    const slot=trim(raw.slot,30),name=trim(raw.name,120);
    if(!name||!slot||!/^[-\w]+$/.test(slot))return null;
    const bonuses=Object.create(null);
    for(const [key,value] of Object.entries(raw.bonuses||{})){
      if(!/^[a-z][a-zA-Z0-9]{0,31}$/.test(key))continue;
      if(typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=100000&&value!==0)
        bonuses[key]=value;
    }
    const cards=Array.isArray(raw.cards)?raw.cards.filter(x=>typeof x==='string').slice(0,6).map(x=>trim(x,75)):[];
    return {
      key:source+':'+index,
      name,slot,source,
      tier:Number.isFinite(raw.tier)?Math.max(0,Math.min(99,raw.tier)):null,
      refine:Number.isFinite(raw.refine)?Math.max(0,Math.min(99,raw.refine)):0,
      bonuses,cards,worn:raw.worn===true
    };
  }
  function normalize(payload,expectedName){
    const p=payload?.player??payload;
    const name=trim(p?.name,30);
    if(!validName(name))throw new RangeError('Invalid player name');
    if(expectedName!==undefined){
      const expected=trim(expectedName,30);
      if(!validName(expected)||name.toLocaleLowerCase()!==expected.toLocaleLowerCase())throw new RangeError('Character name mismatch');
    }
    if(!Array.isArray(p.gear))throw new TypeError('Missing official player gear array');
    if(p.gear.length>5000||p.storage?.gear?.length>5000)throw new RangeError('Gear array exceeds safe limit');
    const bag=p.gear.map((g,i)=>sanitizeGear(g,'背包',i)).filter(Boolean);
    const storage=Array.isArray(p.storage?.gear)?p.storage.gear.map((g,i)=>sanitizeGear(g,'倉庫',i)).filter(Boolean):[];
    return {
      name,level:Number.isInteger(p.level)?p.level:null,
      classId:Number.isInteger(p.classId)?p.classId:null,
      equipped:bag.filter(g=>g.worn),
      candidates:[...bag.filter(g=>!g.worn),...storage],
      source:'Lumivara Explorer 公開玩家資料',
      importedAt:new Date().toISOString()
    };
  }
  function compatible(items,equipped){
    if(!equipped)return [];
    const slot=e=>/^accessory\d*$/.test(e)?'accessory':e;
    return items.filter(g=>slot(g.slot)===slot(equipped.slot));
  }
  function diff(equipped,candidate){
    if(!equipped||!candidate)throw new TypeError('Choose existing and candidate gear');
    if(!compatible([candidate],equipped).length)throw new RangeError('Incompatible equipment slot');
    const out=Object.create(null);
    for(const key of new Set([...Object.keys(equipped.bonuses||{}),...Object.keys(candidate.bonuses||{})])){
      const delta=(candidate.bonuses?.[key]??0)-(equipped.bonuses?.[key]??0);
      if(delta)out[key]=delta;
    }
    return out;
  }
  function suggest(current,delta,type){
    if(!['physical','magic'].includes(type))throw new RangeError('Unknown attack type');
    const keys={
      critDmg:['critdA','critdB'],
      hit:['hitA','hitB'],
      dex:['dexA','dexB'],
      [type==='physical'?'pierce':'magicPierce']:['pierceA','pierceB']
    };
    const out={};
    for(const [key,[from,to]] of Object.entries(keys)){
      if(!delta[key])continue;
      const base=current[from];
      if(typeof base!=='number'||!Number.isFinite(base))throw new RangeError('Current '+from+' is not numeric');
      const next=base+delta[key];
      if(!Number.isFinite(next)||next<0)throw new RangeError('Suggested '+to+' would be negative');
      out[to]=Number(next.toFixed(3));
    }
    return out;
  }
  function label(key){return knownBonuses[key]||key}
  function formatBonus(key,value){
    return label(key)+' '+(value>0?'+':'')+value+(percentage.has(key)?'%':'');
  }
  return Object.freeze({normalize,compatible,diff,suggest,label,formatBonus,knownBonuses});
});
