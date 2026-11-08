// One-time dev-only schema probe. Do not log full player payload, gear names or IDs.
const url='https://lumivaraonline.com/api/explorer/player?name=Gipo';
const res=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(15000)});
if(!res.ok)throw new Error('Explorer HTTP '+res.status);
const data=await res.json();
const player=data?.player;
if(!player||!Array.isArray(player.gear))throw new Error('Unexpected public player shape');
const bag=player.gear,storage=Array.isArray(player.storage?.gear)?player.storage.gear:[];
const gear=[...bag,...storage];
const keys={};
for(const item of gear){
  if(!item||typeof item!=='object')continue;
  for(const [k,v] of Object.entries(item)){
    if(!keys[k])keys[k]={count:0,types:new Set(),present:0};
    keys[k].count++;
    keys[k].types.add(Array.isArray(v)?'array':typeof v);
    if(v!==null&&v!==undefined)keys[k].present++;
  }
}
console.log('PUBLIC GEAR SHAPE',JSON.stringify({
  bagCount:bag.length,storedCount:storage.length,equippedCount:bag.filter(x=>x?.worn===true).length,
  playerKeys:Object.keys(player).sort(),gearKeys:Object.fromEntries(Object.entries(keys).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,{count:v.count,types:[...v.types],present:v.present}])),
}));
for(const k of Object.keys(keys).filter(x=>/set|rarity|class|job|restriction|require|weapon|category|type|level/i.test(x))){
  const sample=gear.filter(g=>g?.[k]!=null).map(g=>g[k]);
  const unique=[...new Set(sample.map(x=>typeof x==='object'?'object '+JSON.stringify(Object.keys(x||{})):String(x)))].slice(0,14);
  console.log('POSSIBLE GEAR META '+k,JSON.stringify({uniqueSample:unique}));
}
console.log('FIRST-GEAR FIELD SHAPE',JSON.stringify(Object.fromEntries(Object.entries(bag[0]||{}).map(([k,v])=>[k,Array.isArray(v)?'array':typeof v]))));

const templateValues=new Map();
for(const g of gear){
 if(typeof g.template!=='string')continue;
 templateValues.set(g.template,(templateValues.get(g.template)||0)+1);
}
console.log('GEAR TEMPLATE SAMPLES',JSON.stringify([...templateValues].sort((a,b)=>b[1]-a[1]).slice(0,35)));
console.log('TOP FIELD SHAPE',JSON.stringify({
  firstNonEmpty:gear.find(g=>Array.isArray(g?.top)&&g.top.length)?.top?.slice(0,4).map(x=>typeof x==='object'?{keys:Object.keys(x),values:Object.fromEntries(Object.entries(x).filter(([k])=>/^(type|stat|key|name|value)$/i.test(k)))}:x),
  nonempty:gear.filter(g=>Array.isArray(g?.top)&&g.top.length).length,
  slots:[...new Set(gear.map(g=>g?.slot).filter(Boolean))].sort(),
  setNamedItems:gear.filter(g=>/warlord|hawkeye|archmage|armor breaker|spellbreaker|executioner|phantom dancer/i.test(g?.name||'')).length,
  templateOnEquipped:bag.filter(g=>g?.worn).map(g=>g.template??null)
}));
