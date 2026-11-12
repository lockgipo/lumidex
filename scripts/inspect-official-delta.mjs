// Read-only official Wiki change audit; no credentials, game client, or market access.
// Usage: node scripts/inspect-official-delta.mjs [--details]
import { readFile } from 'node:fs/promises';
const db = JSON.parse(await readFile(new URL('../data.json', import.meta.url),'utf8'));
const base='https://lumivaraonline.com';
const get=async path=>{const r=await fetch(base+path,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(r.status+' '+path);return r.text();};
const plain=s=>s.replace(/<[^>]+>/g,'').replaceAll('&amp;','&').replaceAll('&nbsp;',' ').replaceAll('&#39;',"'").trim();
const idx={
 cards:{path:'/wiki/cards/',list:db.cards,child:/href="(\/wiki\/cards\/[^"#?]+\/)"[^>]*>([^<]+ Card)<\/a>/g},
 monsters:{path:'/wiki/monsters/',list:db.monsters,child:/href="(\/wiki\/monsters\/[^"#?]+\/)"[^>]*>([^<]+)<\/a>/g},
 maps:{path:'/wiki/maps/',list:db.maps,child:/href="(\/wiki\/maps\/[^"#?]+\/)"[^>]*>([^<]+)<\/a>/g}
};
for(const [type,x] of Object.entries(idx)){
 const html=await get(x.path);
 const all=[...html.matchAll(x.child)].map(m=>({path:m[1],name:plain(m[2])}));
 const unique=all.filter((v,i)=>all.findIndex(z=>z.path===v.path)===i);
 const existing=new Set(x.list.map(v=>v.wiki?new URL(v.wiki).pathname:null).filter(Boolean));
 const named=new Set(x.list.map(v=>v.nameEnglish));
 const delta=unique.filter(v=>!(type==='cards'?existing.has(v.path):named.has(v.name)));
 console.log(type,JSON.stringify({official:unique.length,local:x.list.length,missing:delta}));
 if(process.argv.includes('--details'))for(const v of delta){
  const detail=await get(v.path);
  const factHTML=detail.match(/<dl class="facts">([\s\S]*?)<\/dl>/)?.[1]||'';
  const facts=Object.fromEntries([...factHTML.matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)].map(m=>[plain(m[1]),plain(m[2])]));
  const lead=plain(detail.match(/<p class="lead">([\s\S]*?)<\/p>/)?.[1]||'');
  const source=[...detail.matchAll(/<a href="(\/wiki\/monsters\/[^"]+)">([^<]+)<\/a>/g)].map(m=>({path:m[1],name:m[2]}));
  console.log('DETAIL',JSON.stringify({type,...v,facts,lead,source:source.slice(0,5)}));
 }
}

if(process.argv.includes('--verify-cards')){
 const issues=[];
 const pages=db.cards.map(c=>({c,path:new URL(c.wiki).pathname}));
 for(let i=0;i<pages.length;i+=6){
  await Promise.all(pages.slice(i,i+6).map(async({c,path})=>{
   const html=await get(path);
   const h1=plain(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'');
   if(h1!==c.name)issues.push({id:c.id,type:'name',local:c.name,official:h1});
   const facts=Object.fromEntries([...(html.match(/<dl class="facts">([\s\S]*?)<\/dl>/)?.[1]||'').matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)].map(m=>[plain(m[1]),plain(m[2])]));
   const sell=Number((facts['ขายคืน']||'').replace(/[^\d]/g,''));
   if(sell!==c.npcSell)issues.push({id:c.id,type:'npcSell',local:c.npcSell,official:sell});
   if(facts['ผล']!==c.effectOriginal)issues.push({id:c.id,type:'effectOriginal',local:c.effectOriginal,official:facts['ผล']});
  }));
 }
 console.log('CARDS_VERIFY',JSON.stringify({total:pages.length,issues}));
 if(issues.length)process.exitCode=1;
}
