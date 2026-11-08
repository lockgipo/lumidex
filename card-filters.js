/* LumiDex card tags v0.6.1.
 * Taxonomy only: direct, unconditional numeric bonus words in the existing verified effect text.
 * A special mechanic must not be counted as an unconditional bonus or simulated as damage.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CardFilters=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const categories=Object.freeze([
    {id:'atk',label:'ATK 物理攻擊',pattern:/(?:^|[\s,，])ATK\s*\+\s*\d/i},
    {id:'matk',label:'MATK 魔法攻擊',pattern:/\bMATK\s*\+\s*\d/i},
    {id:'piercePhysical',label:'物理穿透',pattern:/物理穿透\s*\+\s*\d/},
    {id:'pierceMagic',label:'魔法穿透',pattern:/魔法穿透\s*\+\s*\d/},
    {id:'critRate',label:'CRIT 暴擊',pattern:/\bCRIT\s*\+\s*\d/i},
    {id:'critDamage',label:'暴擊傷害',pattern:/暴擊傷害\s*\+\s*\d/},
    {id:'hit',label:'HIT 命中',pattern:/\bHIT\s*\+\s*\d/i},
    {id:'flee',label:'FLEE 閃避',pattern:/\bFLEE\s*\+\s*\d/i},
    {id:'aspd',label:'ASPD 攻速',pattern:/\bASPD\s*\+\s*\d/i},
    {id:'baseStat',label:'STR／DEX 等',pattern:/\b(?:STR|DEX|AGI|VIT|INT|LUK)\s*\+\s*\d/i},
    {id:'hpSp',label:'HP／SP',pattern:/(?:^|[\s,，])(?:HP|SP)\s*\+\s*\d/i},
    {id:'defense',label:'DEF／MDEF',pattern:/\b(?:DEF|MDEF)\s*\+\s*\d/i},
    {id:'utility',label:'其他輔助效果',pattern:/移動速度|施法時間|SP Regen|吸血|冰凍抗性|暈眩抗性|燃燒抗性|攻擊附加|對地屬性傷害|物理傷害反射/},
    {id:'special',label:'特殊機制',pattern:null}
  ].map(x=>Object.freeze(x)));
  const validIds=new Set(categories.map(x=>x.id));
  function classify(card){
    if(!card||typeof card.effect!=='string')return [];
    // Some conditional special effects mention ATK, HIT, etc; they are not permanent additive stats.
    if(card.special)return ['special'];
    return categories.filter(cat=>cat.pattern&&cat.pattern.test(card.effect)).map(cat=>cat.id);
  }
  function filterCards(cards,criteria={},monsters=[]){
    const list=Array.isArray(criteria.categories)?criteria.categories:[];
    if(list.some(id=>!validIds.has(id)))return [];
    const monsterById=new Map(monsters.map(m=>[m.id,m]));
    const mapForId=id=>monsterById.get(id)?.map;
    return cards.filter(c=>{
      const verifiedDrops=Array.isArray(c.verifiedDrops)?c.verifiedDrops:[];
      const hasMonster=verifiedDrops.length>0;
      const hasSpecial=!!c.specialDrop;
      if(criteria.source==='verifiedMonster'&&!hasMonster)return false;
      if(criteria.source==='special'&&!hasSpecial)return false;
      if(criteria.source==='unverified'&&(hasMonster||hasSpecial))return false;
      if(criteria.onlyVerified&&!hasMonster&&!hasSpecial)return false;
      if(criteria.slot&&!(c.slotList||[]).some(slot=>slot===criteria.slot||slot==='所有部位'))return false;
      if(criteria.monsterId&&!verifiedDrops.some(drop=>drop.monster===criteria.monsterId))return false;
      if(criteria.mapName){
        const allReferences=[...(c.relatedMonsters||[]),...verifiedDrops.map(d=>d.monster)];
        const mapped=criteria.source==='verifiedMonster'||criteria.monsterId
          ?verifiedDrops.map(d=>d.monster)
          :allReferences;
        if(!mapped.some(id=>mapForId(id)===criteria.mapName))return false;
      }
      const tags=classify(c);
      return list.every(id=>tags.includes(id));
    });
  }
  return Object.freeze({categories,classify,filterCards});
});
