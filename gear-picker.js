/* LumiDex gear picker: class-aware filtering with intentionally conservative rules.
   Only confirmed class/weapon rules. Does not infer set membership or final stats. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LumiGearPicker=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const jobs=Object.freeze({
    novice:{name:'初心者',weapons:['knife','sword','hammer']},
    swordsman:{name:'劍士',weapons:['sword']},
    mage:{name:'法師',weapons:['rod','staff']},
    archer:{name:'弓箭手',weapons:['bow']},
    cleric:{name:'神官',weapons:['quarterstaff']},
    merchant:{name:'商人',weapons:['hammer']},
    thief:{name:'盜賊',weapons:['knife']}
  });
  // Do not substitute internal gear slot "sword" for the weapon type.
  const weaponTypes=['dagger_pair','quarterstaff','royal_tablet','rune_grimoire','viper_kunai','twin_pistols','lionheart_aegis','neko_flask','cestus','katana','hammer','sword','knife','staff','rod','bow','kunai'];
  const alias=Object.freeze({kunai:'viper_kunai'});
  const statLabels=Object.freeze({
    dex:'DEX',atk:'ATK',pierce:'物理穿透',critDmg:'爆擊傷害',hit:'HIT',agi:'AGI',str:'STR',int:'INT',vit:'VIT',luk:'LUK',flee:'FLEE',matk:'MATK',crit:'CRIT',mcrit:'MCRIT',magicPierce:'魔法穿透',atkPct:'ATK%',matkPct:'MATK%'
  });
  const stats=['dex','atk','pierce','critDmg','hit','agi','str','int','crit','matk','flee','vit','luk'];
  const withStats=(g)=>Object.entries(g.bonuses||{}).filter(([,v])=>Number.isFinite(v)&&v!==0);
  function normalizeJob(value){
    const id=String(value||'').toLowerCase().trim().replace(/[-\s]+/g,'_');
    return jobs[id]?id:'';
  }
  function weaponType(g){
    if(!g||g.slot!=='sword')return '';
    let template=String(g.template||'').toLowerCase().trim().replace(/\s+/g,'_');
    template=alias[template]||template;
    if(weaponTypes.includes(template))return template;
    const name=String(g.name||'').toLowerCase().replace(/^\+?\d+\s*/,'').replace(/^(?:i|ii|iii|iv|v|vi|vii)\s+/,'');
    for(const type of weaponTypes){
      const phrase=type.replace(/_/g,'[ _-]');
      if(new RegExp('(?:^|\\s)'+phrase+'(?:$|\\s)','i').test(name))return alias[type]||type;
    }
    return '';
  }
  function usability(g,job){
    const current=normalizeJob(job);
    if(!g||!current)return 'unknown';
    if(g.slot!=='sword')return 'unknown'; // armor/offhand needs separate authoritative rules
    const type=weaponType(g);
    if(!type)return 'unknown';
    return jobs[current].weapons.includes(type)?'allowed':'blocked';
  }
  function relatedCandidates(items,equipped,job,opts={}){
    if(!equipped)return {all:[],visible:[],blocked:0,unknown:0};
    const baseSlot=slot=>/^accessory\d*$/.test(slot)?'accessory':slot;
    const same=(items||[]).filter(g=>baseSlot(g.slot)===baseSlot(equipped.slot));
    const blocked=same.filter(g=>usability(g,job)==='blocked').length;
    const unknown=same.filter(g=>usability(g,job)==='unknown').length;
    const q=String(opts.query||'').trim().toLowerCase();
    const source=String(opts.source||'all');
    const order=String(opts.sort||'dex');
    const considered=same.filter(g=>{
      if(opts.hideBlocked!==false&&usability(g,job)==='blocked')return false;
      if(source!=='all'&&g.source!==source)return false;
      if(!q)return true;
      const hay=[g.name,g.template,g.source,...withStats(g).flatMap(([k,v])=>[k,statLabels[k]||k,String(v),String(k+' '+v)])].join(' ').toLowerCase();
      return hay.includes(q);
    });
    considered.sort((a,b)=>((b.bonuses?.[order]||0)-(a.bonuses?.[order]||0))||a.name.localeCompare(b.name)||a.key.localeCompare(b.key));
    return {all:same,visible:considered,blocked,unknown};
  }
  function topStats(gear,focus,max=4){
    const entries=withStats(gear).sort(([a],[b])=>{
      if(a===focus)return -1;if(b===focus)return 1;
      return stats.indexOf(a)===-1?1:stats.indexOf(b)===-1?-1:stats.indexOf(a)-stats.indexOf(b);
    });
    return entries.slice(0,max).map(([k,v])=>({key:k,label:statLabels[k]||k,value:v}));
  }
  return Object.freeze({jobs,statLabels,normalizeJob,weaponType,usability,relatedCandidates,topStats});
});
