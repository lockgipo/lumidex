// Curated snapshot update from official public Wiki. No login or player/market data.
// The explicit Traditional Chinese labels below are provisional until current in-game verification.
// Run --check to validate official pages, --write to update data.json + embedded homepage data.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mode=process.argv[2]||'--check';
if(!['--check','--write'].includes(mode))throw Error('Use --check or --write');
const base='https://lumivaraonline.com';
const fetchPage=async url=>{const r=await fetch(base+url,{signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error('HTTP '+r.status+' '+url);return r.text();};
const clean=s=>s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim();
const number=x=>{const n=Number(String(x).replace(/[, Silver%]/g,''));if(!Number.isFinite(n))throw Error('Invalid number: '+x);return n;};
const facts=html=>Object.fromEntries([...(html.match(/<dl class="facts">([\s\S]*?)<\/dl>/)?.[1]||'').matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)].map(m=>[clean(m[1]),clean(m[2])]));
const t=(s)=>s+'（暫譯）';
const maps=[
 {name:'Frostbell Toyworks',zh:'霜鈴玩具工廠',slug:'toyworks',monsters:['gingerbread-man','wind-up-teddy','jack-in-the-box','nutcracker-soldier','leader-nutcracker-soldier']},
 {name:'Frostbell Chocolate Works',zh:'霜鈴巧克力工廠',slug:'chocolate',monsters:['gummy-bear','cocoa-imp','marshmallow-brute','chocolate-golem','leader-chocolate-golem']}
];
const newcomers=[
 ['gingerbread-man','Gingerbread Man','薑餅人','gingerbread-man','gingerbread_crumb','Gingerbread Crumb','薑餅碎屑',99],
 ['wind-up-teddy','Wind-up Teddy','發條泰迪熊','windup-teddy','brass_windup_key','Brass Wind-up Key','黃銅發條鑰匙',101],
 ['jack-in-the-box','Jack-in-the-Box','驚喜盒怪','jack-in-the-box','jester_spring','Jester Spring','小丑彈簧',105],
 ['nutcracker-soldier','Nutcracker Soldier','胡桃鉗士兵','nutcracker-soldier','nutcracker_jaw','Nutcracker Jaw','胡桃鉗下顎',110],
 ['gummy-bear','Gummy Bear','軟糖熊','gummy-bear','gummy_jelly','Gummy Jelly','軟糖果凍',99],
 ['cocoa-imp','Cocoa Imp','可可小鬼','cocoa-imp','cocoa_bean','Cocoa Bean','可可豆',101],
 ['marshmallow-brute','Marshmallow Brute','棉花糖巨漢','marshmallow-brute','toasted_marshmallow','Toasted Marshmallow','烤棉花糖',105],
 ['chocolate-golem','Chocolate Golem','巧克力魔像','chocolate-golem','chocolate_core','Chocolate Core','巧克力核心',110]
];
const specialCards=[
 ['gingerbread-man','gingerbread_card','遭怪物普攻或屬性技能命中時，有 25% 機率使該怪物緩速 3 秒（移動速度 -35%、攻擊速度 -15%；Leader／Boss 免疫）'],
 ['wind-up-teddy','teddy_card','普攻命中怪物時回復自身 MaxHP 的 1%（每 0.5 秒最多一次）；裝備期間藥水與 HP 回復道具效果 -50%'],
 ['jack-in-the-box','jack_card','連續 6 秒未施放技能後的首次施法，該次技能對怪物造成傷害 +35%（含所有目標與每段命中）'],
 ['nutcracker-soldier','nutcracker_card','攻擊命中有 5% 機率使怪物 DEF -20%，持續 4 秒（技能每次施放僅判定第一隻命中怪物一次；Leader／Boss 免疫）'],
 ['gummy-bear','gummy_card','成功閃避怪物普攻或技能後，移動速度 +30%，持續 2 秒（每 4 秒最多一次）'],
 ['cocoa-imp','cocoa_card','自身治療技能使目標每秒回復 MaxHP 的 2%，持續 4 秒（不可疊加，再次治療刷新時間）；自身對怪物的技能傷害 -10%'],
 ['marshmallow-brute','marshmallow_card','受到怪物單次傷害超過 MaxHP 15% 時，超過部分減傷 50%（與其他減傷卡組合的總效果受官方 30% 上限限制）'],
 ['chocolate-golem','chocogolem_card','普攻擊殺怪物後留下 3 秒熔融巧克力，使 100 px 內其他怪物緩速（每 3 秒最多一處；Leader／Boss 免疫；技能擊殺不觸發）']
];
const packCards=[
 ['card-crystal-fox-arcane','Crystal Fox Card','水晶狐卡片','lm01m_rare_card','MATK +1%, MCRIT +1, 魔法穿透 +2%','Rare'],
 ['card-rose-fox-arcane','Rose Fox Card','玫瑰狐卡片','lm01m_epic_card','MATK +2%, MCRIT +2, 魔法穿透 +3%','Epic'],
 ['card-golden-fox-arcane','Golden Fox Card','黃金狐卡片','lm01m_legendary_card','MATK +3%, MCRIT +3, 魔法穿透 +5%','Legendary'],
 ['card-arcane-piercer','Arcane Piercer Card',t('奧術穿透者卡片'),'lm01m_limited_card','MATK +5%, MCRIT +4, 魔法穿透 +7%, 對地屬性傷害 +20%','Limited']
];
const renamed=[
 ['card-crystal-fox','Crystal Dragon Card',t('水晶龍卡片')],
 ['card-rose-fox','Rose Dragon Card',t('玫瑰龍卡片')],
 ['card-golden-fox','Golden Dragon Card',t('黃金龍卡片')],
 ['card-pierce-empress','Pierce Dragon Card',t('穿透龍卡片')]
];
const thaiSlots={'รองเท้า':'鞋子','เครื่องประดับ':'飾品','ผ้าคลุม':'披風','เสื้อเกราะ':'身體護甲','มือซ้าย':'左手','ศีรษะบน':'頭部上層','ศีรษะกลาง':'頭部中層','ศีรษะล่าง':'頭部下層'};
const db=JSON.parse(await readFile(path.join(root,'data.json'),'utf8'));
const originalIDs=Object.fromEntries(['cards','monsters','maps','materials'].map(k=>[k,new Set(db[k].map(x=>x.id))]));
if(db.cards.length!==88&&db.cards.length!==100)throw Error('Unexpected local card count');
const indexes=await Promise.all(['cards','monsters','maps'].map(async(k)=>{const html=await fetchPage('/wiki/'+k+'/');const paths=[...new Set([...html.matchAll(new RegExp('href="(\\/wiki\\/'+k+'\\/[^"#?]+\\/)"','g'))].map(m=>m[1]))];return {k,paths};}));
for(const {k,paths} of indexes){const required={cards:100,monsters:100,maps:20}[k];if(paths.length!==required)throw Error('Official '+k+' count '+paths.length+' != '+required);}
const cardPaths=new Set(indexes.find(x=>x.k==='cards').paths),monPaths=new Set(indexes.find(x=>x.k==='monsters').paths);
const today=new Date().toISOString().slice(0,10);
const byMonName=new Map(db.monsters.map(x=>[x.name,x]));
for(const [id,name,zh,slug,itemSlug,itemName,itemZh,itemValue] of newcomers){
 const monPath='/wiki/monsters/'+slug+'/';
 if(!monPaths.has(monPath))throw Error('Not official monster '+monPath);
 const html=await fetchPage(monPath);
 const heading=clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'');
 const f=facts(html);
 if(heading!==name||!f['เลเวล'])throw Error('Monster identity mismatch: '+name);
 const lead=clean(html.match(/<p class="lead">([\s\S]*?)<\/p>/)?.[1]||'');
 const map=maps.find(m=>lead.includes(m.name));
 if(!map)throw Error('Map missing for '+name);
 const monId='monster-'+id;
 if(!db.monsters.some(x=>x.id===monId))db.monsters.push({id:monId,name,level:number(f['เลเวล']),leader:false,map:map.name,nameEnglish:name,nameZh:t(zh),translationStatus:'tentative'});
 if(!db.materials.some(x=>x.sourceMonster===monId)){
  const dropHTML=html.match(/<h2>ไอเทมดรอป[\s\S]*?<\/table>/)?.[0]||'';
  const firstDrop=dropHTML.match(/<a href="\/wiki\/items\/([^/]+)\/">([^<]+)<\/a>/);
  if(!firstDrop||clean(firstDrop[2])!==itemName||!dropHTML.includes('30%'))throw Error('Material source mismatch: '+itemName);
  const actualSlug=firstDrop[1];
  const itemHTML=await fetchPage('/wiki/items/'+actualSlug+'/');
  const itemHead=clean(itemHTML.match(/<h1>(.*?)<\/h1>/)?.[1]||'');
  if(itemHead!==itemName)throw Error('Material name mismatch '+itemName+' '+itemHead);
  db.materials.push({id:'item-'+actualSlug,name:itemName,nameEnglish:itemName,nameZh:t(itemZh),category:'材料',sourceMonster:monId,dropRate:30,npcSell:itemValue,weight:1,wiki:base+'/wiki/items/'+actualSlug+'/',sourceUrl:base+monPath,translationStatus:'tentative'});
 }
}
for(const map of maps){
 const p='/wiki/maps/'+map.slug+'/';
 const html=await fetchPage(p);
 if(clean(html.match(/<h1>(.*?)<\/h1>/)?.[1]||'')!==map.name)throw Error('Map name mismatch: '+map.name);
 const shown=[...html.matchAll(/href="\/wiki\/monsters\/[^"]+\/">([^<]+)<\/a>/g)].map(x=>x[1]);
 const ids=map.monsters.map(slug=>{
  const mon=db.monsters.find(m=>m.id==='monster-'+slug);
  if(mon)return mon.id;
  if(!slug.startsWith('leader-'))throw Error('Missing map monster '+slug);
  const original=db.monsters.find(m=>m.name===('Leader '+newcomers.find(x=>x[0]===slug.replace('leader-',''))?.[1]));
  if(original)return original.id;
  const name='Leader '+newcomers.find(x=>x[0]===slug.replace('leader-',''))?.[1];
  if(!name||!shown.includes(name))throw Error('Leader name missing '+name);
  const standard=db.monsters.find(x=>x.name===name.slice(7));
  const leader={id:'monster-'+slug,name,level:155,leader:true,map:map.name,nameEnglish:name,nameZh:t('首領 '+standard.nameZh.replace('（暫譯）','')),translationStatus:'tentative'};
  db.monsters.push(leader);return leader.id;
 });
 if(shown.length!==5||ids.some(id=>!db.monsters.find(m=>m.id===id)))throw Error('Map monster mismatch '+map.name);
 if(!db.maps.some(x=>x.name===map.name))db.maps.push({id:'map-frostbell-'+map.slug,name:map.name,zh:t(map.zh),range:[141,150],monsters:ids,nameEnglish:map.name,nameZh:t(map.zh),previousZh:null,translationStatus:'tentative'});
}
const monByWiki=new Map(db.monsters.map(m=>['/wiki/monsters/'+(newcomers.find(x=>x[1]===m.name)?.[3]||m.id.replace(/^monster-/,'').replace(/^leader-/,'leader-'))+'/',m.id]));
for(const [slug,cardSlug,zhEffect] of specialCards){
 const monster=db.monsters.find(m=>m.id==='monster-'+slug);
 const p='/wiki/cards/'+cardSlug+'/';
 if(!cardPaths.has(p))throw Error('Missing card '+p);
 const html=await fetchPage(p),f=facts(html);
 const english=monster.name+' Card';
 if(clean(html.match(/<h1>(.*?)<\/h1>/)?.[1]||'')!==english)throw Error('Unexpected card title '+p);
 const slotList=f['ใส่ได้']?.split(/,\s*/).map(x=>thaiSlots[x]);
 if(!slotList?.length||slotList.some(x=>!x))throw Error('Card slot unknown: '+p+' '+f['ใส่ได้']);
 const rows=[...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m=>m[1]);
 const drops=rows.flatMap(row=>{
  const link=row.match(/<a href="\/wiki\/monsters\/[^"]+\/">([^<]+)<\/a>/);
  if(!link)return [];
  const id=db.monsters.find(m=>m.name===link[1])?.id;
  const rate=row.match(/<td>([\d.]+)%\s*(?:\(|<\/td>)/);
  if(!id||!rate)throw Error('Drop cannot be verified '+english+' '+link[1]);
  return [{monster:id,rate:Number(rate[1])}];
 });
 if(!drops.length)throw Error('No confirmed drop for '+english);
 const id='card-'+slug;
 if(db.cards.some(c=>c.id===id))continue;
 db.cards.push({id,name:english,effect:zhEffect,effectOriginal:f['ผล'],special:true,mapHint:monster.map,relatedMonsters:drops.map(d=>d.monster),verifiedDrops:drops,dropVerified:true,slot:slotList.join('、'),source:null,wiki:base+p,nameEnglish:english,nameZh:t(monster.nameZh.replace('（暫譯）','')+'卡片'),slotList,tier:'🜂 機制卡',npcSell:number(f['ขายคืน']),cardPackRate:number(f['จาก Monster Card Pack']),translationStatus:'tentative'});
}
for(const [id,english,zh] of renamed){
 const c=db.cards.find(x=>x.id===id);
 if(!c)throw Error('Missing legacy card '+id);
 const sourcePath=new URL(c.wiki).pathname;
 const html=await fetchPage(sourcePath);
 const actual=clean(html.match(/<h1>(.*?)<\/h1>/)?.[1]||'');
 if(actual!==english)throw Error('Renamed card mismatch '+id+': '+actual);
 if(c.name!==english){c.previousName=c.name;c.previousNameZh=c.nameZh;c.name=english;c.nameEnglish=english;c.nameZh=zh;c.translationStatus='tentative';}
}
for(const [id,english,zh,slug,effect,tier] of packCards){
 const p='/wiki/cards/'+slug+'/';
 const html=await fetchPage(p),f=facts(html);
 if(!cardPaths.has(p)||clean(html.match(/<h1>(.*?)<\/h1>/)?.[1]||'')!==english)throw Error('Pack card title mismatch '+english);
 if(!/^MATK/.test(f['ผล'])||!f['ผล'].includes('MCRIT')||f['ใส่ได้']!=='มือซ้าย')throw Error('Pack card stats mismatch '+english);
 if(db.cards.some(x=>x.id===id))continue;
 db.cards.push({id,name:english,effect,effectOriginal:f['ผล'],special:false,mapHint:null,relatedMonsters:[],verifiedDrops:[],dropVerified:false,slot:'左手',source:'限定卡包 LM-01 Arcane Piercer（非怪物掉落）',wiki:base+p,nameEnglish:english,nameZh:zh,slotList:['左手'],tier:'LM-01 '+tier,npcSell:number(f['ขายคืน']),cardPackRate:null,...(zh.includes('暫譯')?{translationStatus:'tentative'}:{})});
}
for(const [id,crit] of [['card-crimson-knight',5],['card-bloodcrystal-dragon',7],['card-critical-king',7]]){
 const c=db.cards.find(x=>x.id===id);if(!c)throw Error('Card missing '+id);
 const f=facts(await fetchPage(new URL(c.wiki).pathname));
 if(!f['ผล'].includes('MCRIT +'+crit))throw Error('MCRIT not on official '+id);
 if(!c.effect.includes('MCRIT +'))c.effect=c.effect.replace(/CRIT \+\d+/,m=>m+', MCRIT +'+crit);
 c.effectOriginal=f['ผล'];
}
if(db.cards.length!==100||db.monsters.length!==100||db.maps.length!==20||db.materials.length!==80)throw Error('Final counts wrong '+['cards','monsters','maps','materials'].map(k=>k+':'+db[k].length));
for(const k of Object.keys(originalIDs))for(const id of originalIDs[k])if(!db[k].some(x=>x.id===id))throw Error('Lost original '+k+' id: '+id);
const unique=(x,k)=>new Set(x.map(z=>z[k])).size===x.length;
for(const k of ['cards','monsters','maps','materials'])if(!unique(db[k],'id'))throw Error('Duplicate IDs in '+k);
for(const c of db.cards)for(const d of c.verifiedDrops)if(!db.monsters.find(m=>m.id===d.monster))throw Error('Dangling card drop '+c.id);
db.meta={...db.meta,cards:100,monsters:100,maps:20,materials:80,verifiedCards:db.cards.filter(c=>c.verifiedDrops.length>0).length,checked:today,version:'0.4.0',localized:{cards:100,monsters:100,maps:20,language:'zh-Hant',source:'V119 player terminology for existing names; new names marked tentative pending in-game confirmation'},sourceNote:'Official Wiki '+today+' card and monster details. 8 new materials NPC prices manually verified from official Wiki drop-system table on 2026-11-12. No player market prices.'};
console.log('VALIDATED',JSON.stringify(db.meta));
if(mode==='--write'){
 const htmlPath=path.join(root,'index.html'),html=await readFile(htmlPath,'utf8');
 const tag=/<script id="db" type="application\/json">[\s\S]*?<\/script>/;
 if(!tag.test(html))throw Error('Embedded catalog missing');
 const updated=html.replace(tag,'<script id="db" type="application/json">'+JSON.stringify(db,null,2)+'</script>');
 await writeFile(path.join(root,'data.json'),JSON.stringify(db,null,2)+'\n');
 await writeFile(htmlPath,updated,'utf8');
 console.log('WROTE data.json + index.html embedded catalog');
}
