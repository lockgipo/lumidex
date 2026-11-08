/* LumiDex manually assigned sets. Rules from official Lumivara Wiki (2026-11-08).
   Explorer does NOT expose each item's set; never guess membership. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LumiSets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const wiki='https://lumivaraonline.com/wiki/';
const definitions=Object.freeze([
 {id:'warlord',name:'Warlord',pieces:2,repeat:true,bonus:{atkPct:10}},
 {id:'archmage',name:'Archmage',pieces:2,repeat:true,bonus:{matkPct:10}},
 {id:'phantom-dancer',name:'Phantom Dancer',pieces:4,bonus:{flee:200,atkPct:10,moveSpeedPct:7}},
 {id:'hawkeye',name:'Hawkeye',pieces:4,bonus:{hit:250,atkPct:10,matkPct:10,moveSpeedPct:7}},
 {id:'mystic-sage',name:'Mystic Sage',pieces:4,bonus:{dex:30,matkPct:10,spRegen:5,moveSpeedPct:7}},
 {id:'lucky-star',name:'Lucky Star',pieces:2,repeat:true,bonus:{crit:10},notes:['CRIT 是點數，不等於實際爆擊機率']},
 {id:'iron-bastion',name:'Iron Bastion',pieces:2,repeat:true,bonus:{hp:500,def:7,mdef:10}},
 {id:'blood-lord',name:'Blood Lord',pieces:6,bonus:{carryWeight:2000,damageDealtPct:-30},
  notes:['命中時吸取造成傷害的 100% HP（每次最多恢復最大 HP 5%）','每次命中消耗最大 SP 的 3%','全傷害 -30%，目前傷害分析器尚未處理']},
 {id:'executioner',name:'Executioner',pieces:2,repeat:true,bonus:{critDmg:15}},
 {id:'armor-breaker',name:'Armor Breaker',pieces:2,repeat:true,bonus:{pierce:7}},
 {id:'spellbreaker',name:'Spellbreaker',pieces:2,repeat:true,bonus:{magicPierce:7}}
]);
const byId=Object.freeze(Object.fromEntries(definitions.map(s=>[s.id,s])));
const labels={atkPct:'ATK%',matkPct:'MATK%',flee:'FLEE',hit:'HIT',moveSpeedPct:'移動速度',
 dex:'DEX',spRegen:'SP 恢復',crit:'CRIT 點數',hp:'HP',def:'DEF',mdef:'MDEF',
 carryWeight:'負重',damageDealtPct:'全傷害',critDmg:'暴擊傷害',pierce:'物理穿透',magicPierce:'魔法穿透'};
const percent=new Set(['atkPct','matkPct','moveSpeedPct','damageDealtPct','critDmg','pierce','magicPierce']);
function count(n){if(!Number.isInteger(n)||n<0||n>6)throw new RangeError('套裝件數必須是 0～6 的整數');return n;}
function evaluate(id,n){
 const set=byId[id];if(!set)throw new RangeError('不支援的套裝');
 count(n);
 const stacks=set.repeat?Math.min(3,Math.floor(n/2)):(n>=set.pieces?1:0);
 return {id,name:set.name,pieces:n,need:set.pieces,repeat:!!set.repeat,stacks,
  next:stacks===0?set.pieces:set.repeat&&stacks<3?2*(stacks+1):null,
  active:stacks>0,
  bonus:Object.fromEntries(Object.entries(set.bonus).map(([k,v])=>[k,v*stacks])),
  notes:stacks>0?[...(set.notes||[])]:[]};
}
function compare(rows){
 if(!Array.isArray(rows)||rows.length>11)throw new RangeError('套裝數量過多');
 const used=new Set(),entries=[],A={},B={};let totalA=0,totalB=0;
 for(const row of rows){
  if(!byId[row?.id]||used.has(row.id))throw new RangeError('請選擇不重複的有效套裝');
  used.add(row.id);const a=count(row.a),b=count(row.b);totalA+=a;totalB+=b;
  const sa=evaluate(row.id,a),sb=evaluate(row.id,b);
  for(const [k,v] of Object.entries(sa.bonus))A[k]=(A[k]||0)+v;
  for(const [k,v] of Object.entries(sb.bonus))B[k]=(B[k]||0)+v;
  entries.push({id:row.id,name:sa.name,a:sa,b:sb});
 }
 if(totalA>6||totalB>6)throw new RangeError('六個防具部位中，A 與 B 各自最多只能計入六件套裝裝備');
 const delta={};
 for(const key of new Set([...Object.keys(A),...Object.keys(B)])){
  const d=(B[key]||0)-(A[key]||0);if(d)delta[key]=d;
 }
 const supported=new Set(['atkPct','matkPct','hit','dex','critDmg','pierce','magicPierce']);
 return {entries,totalA,totalB,statsA:A,statsB:B,delta,
  blocksDamageComparison:!!delta.damageDealtPct,
  unmodeled:Object.keys(delta).filter(k=>!supported.has(k))};
}
function format(key,value){return (labels[key]||key)+' '+(value>0?'+':'')+value+(percent.has(key)?'%':'');}
function composeValues(baseline,gearChanges,setDiff,type){
 if(!['physical','magic'].includes(type))throw new RangeError('傷害類型錯誤');
 if(setDiff?.damageDealtPct)throw new RangeError('Blood Lord 的全傷害 -30% 尚未納入分析，不可當成完整傷害比較');
 const target={};
 for(const field of ['pierceB','atkB','critdB','critB','hitB','dexB']){
  const orig=field.replace(/B$/,'A');const v=baseline[orig];
  if(typeof v!=='number'||!Number.isFinite(v)||v<0)throw new RangeError(orig+' 必須填寫有效的非負數');
  target[field]=v;
 }
 for(const [field,v] of Object.entries(gearChanges||{})){
  if(!Object.hasOwn(target,field))continue;
  target[field]+=v-baseline[field.replace(/B$/,'A')];
 }
 const map={[type==='physical'?'atkPct':'matkPct']:'atkB',hit:'hitB',dex:'dexB',
  critDmg:'critdB',[type==='physical'?'pierce':'magicPierce']:'pierceB'};
 for(const [k,field] of Object.entries(map)){
  const v=setDiff?.[k]||0;
  if(!Number.isFinite(v))throw new RangeError('套裝加成無效');
  target[field]+=v;
 }
 if(Object.values(target).some(v=>!Number.isFinite(v)||v<0))throw new RangeError('替換後能力低於 0，請核對 A 面板與套裝件數');
 if(target.critB>100)throw new RangeError('爆擊率不能超過 100%');
 return target;
}
return Object.freeze({wiki,definitions,byId,labels,evaluate,compare,format,composeValues});
});
