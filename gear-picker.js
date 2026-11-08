/* LumiDex gear picker, all official base/advanced classes and verified weapon restrictions. */
(function(root,factory){
  const zh=typeof module==='object'&&module.exports?require('./gear-localization.js'):root.LumiGearZh;
  const api=factory(zh);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LumiGearPicker=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(zh){
  'use strict';
  const jobs=Object.freeze({
    novice:{name:'初心者',english:'Novice',group:'base',weapons:['knife','sword','hammer']},
    swordsman:{name:'劍士',english:'Swordsman',group:'base',weapons:['sword']},
    mage:{name:'法師',english:'Mage',group:'base',weapons:['rod','staff']},
    archer:{name:'弓箭手',english:'Archer',group:'base',weapons:['bow']},
    cleric:{name:'神官',english:'Cleric',group:'base',weapons:['quarterstaff']},
    merchant:{name:'商人',english:'Merchant',group:'base',weapons:['hammer']},
    thief:{name:'盜賊',english:'Thief',group:'base',weapons:['knife','dagger_pair']},
    kensei:{name:'劍聖',english:'Kensei',group:'advanced',weapons:['katana']},
    iron_fist:{name:'鐵拳',english:'Iron Fist',group:'advanced',weapons:['cestus']},
    wicked_necromancer:{name:'死靈法師',english:'Wicked Necromancer',group:'advanced',weapons:['rune_grimoire']},
    king:{name:'王者',english:'The King',group:'advanced',weapons:['royal_tablet']},
    sinister:{name:'雙槍手',english:'Sinister',group:'advanced',weapons:['twin_pistols']},
    templar:{name:'聖殿騎士',english:'Templar',group:'advanced',weapons:['lionheart_aegis']},
    nekobaku:{name:'貓咪煉金術師',english:'Nekobaku',group:'advanced',weapons:['neko_flask']},
    mamushi:{name:'毒蛇',english:'Mamushi',group:'advanced',weapons:['viper_kunai']}
  });
  const jobAliases=Object.freeze({
    the_king:'king',theking:'king',wickednecromancer:'wicked_necromancer',
    wicked_necro:'wicked_necromancer',ironfist:'iron_fist',iron_fist:'iron_fist',
    neko_baku:'nekobaku',mamushi:'mamushi'
  });
  const weaponTypes=[
    'lionheart_aegis','rune_grimoire','royal_tablet','dagger_pair',
    'quarterstaff','twin_pistols','viper_kunai','neko_flask','cestus',
    'katana','hammer','sword','knife','staff','rod','bow'
  ];
  const weaponAliases=Object.freeze({kunai:'viper_kunai',tablet:'royal_tablet',grimoire:'rune_grimoire',pistols:'twin_pistols'});
  const statLabels=Object.freeze({
    dex:'DEX',atk:'ATK',pierce:'物理穿透',critDmg:'爆擊傷害',hit:'HIT',
    agi:'AGI',str:'STR',int:'INT',vit:'VIT',luk:'LUK',flee:'FLEE',
    matk:'MATK',crit:'CRIT',mcrit:'MCRIT',magicPierce:'魔法穿透',atkPct:'ATK%',matkPct:'MATK%'
  });
  const statOrder=['dex','atk','pierce','critDmg','hit','agi','str','int','crit','matk','flee','vit','luk'];
  const withStats=g=>Object.entries(g.bonuses||{}).filter(([,v])=>Number.isFinite(v)&&v!==0);
  function normalizeJob(value){
    const id=String(value??'').trim().toLowerCase().replace(/[-\s]+/g,'_');
    const resolved=jobAliases[id]||id;
    return Object.hasOwn(jobs,resolved)?resolved:'';
  }
  function weaponType(g){
    if(!g||g.slot!=='sword')return '';
    const template=String(g.template||'').trim().toLowerCase().replace(/[-\s]+/g,'_');
    const t=weaponAliases[template]||template;
    if(weaponTypes.includes(t))return t;
    const name=String(g.name||'').toLowerCase().replace(/^\+?\d+\s*/,'').replace(/^(?:viii|vii|vi|iv|iii|ix|ii|i|v|x)\s+/,'');
    for(const type of weaponTypes){
      const pattern=type.replace(/_/g,'[ _-]');
      if(new RegExp('(?:^|\\s)'+pattern+'(?:$|\\s)','i').test(name))return type;
    }
    return '';
  }
  function inferJobFromEquipped(items){
    const types=new Set((items||[]).map(weaponType).filter(Boolean));
    if(types.size!==1)return '';
    const type=[...types][0];
    const matches=Object.entries(jobs).filter(([key,job])=>key!=='novice'&&job.weapons.includes(type));
    return matches.length===1?matches[0][0]:'';
  }
  function usability(g,job){
    const current=normalizeJob(job);
    if(!g||!current||g.slot!=='sword')return 'unknown';
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
    const q=String(opts.query||'').trim().toLocaleLowerCase();
    const source=String(opts.source||'all'),order=String(opts.sort||'dex');
    const visible=same.filter(g=>{
      if(opts.hideBlocked!==false&&usability(g,job)==='blocked')return false;
      if(source!=='all'&&g.source!==source)return false;
      if(!q)return true;
      const tokens=[g.name,g.template,g.source,zh?.title(g),zh?.slot(g.slot),
        ...withStats(g).flatMap(([k,v])=>[k,statLabels[k]||k,String(v),k+' '+v])];
      return tokens.join(' ').toLocaleLowerCase().includes(q);
    });
    visible.sort((a,b)=>((b.bonuses?.[order]||0)-(a.bonuses?.[order]||0))||
      a.name.localeCompare(b.name)||String(a.key).localeCompare(String(b.key)));
    return {all:same,visible,blocked,unknown};
  }
  function topStats(g,focus,max=4){
    return withStats(g).sort(([a],[b])=>{
      if(a===focus)return -1;
      if(b===focus)return 1;
      const x=statOrder.indexOf(a),y=statOrder.indexOf(b);
      return (x<0?100:x)-(y<0?100:y)||a.localeCompare(b);
    }).slice(0,max).map(([key,value])=>({key,label:statLabels[key]||key,value}));
  }
  return Object.freeze({jobs,statLabels,normalizeJob,weaponType,inferJobFromEquipped,usability,relatedCandidates,topStats});
});