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
