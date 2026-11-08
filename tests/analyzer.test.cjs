const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'analyzer.html'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const db=require('../data.json');
const monsterStats=require('../monster-stats.json');
const Combat=require('../combat-model.js');

test('main catalog links to a complete and loadable combat preview',()=>{
  assert.match(index,/href="analyzer\.html"/);
  assert.match(html,/src="combat-model\.js"/);
  assert.match(html,/fetch\('monster-stats\.json'\)/);
  const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];
  assert.doesNotThrow(()=>new vm.Script(inline));
});

test('interactive preview filters map monsters and respects selected monster and observed damage',async()=>{
  const elements=new Map();
  const values={map:'',monster:'',type:'physical',hit:'350',hitplus:'20',pierce:'35',pierceplus:'10',observed:'',leaders:'',guaranteed:''};
  function el(id){
    if(!elements.has(id))elements.set(id,{
      value:values[id]??'',checked:false,textContent:'',className:'',innerHTML:'',
      listeners:{},addEventListener(type,cb){this.listeners[type]=cb;}
    });
    return elements.get(id);
  }
  const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];
  const context=vm.createContext({
    document:{getElementById:el},
    fetch:async name=>({ok:true,json:async()=>name==='data.json'?db:monsterStats}),
    LumiCombat:Combat
  });
  vm.runInContext(source,context);
  for(let n=0;n<10;n++)await new Promise(resolve=>setImmediate(resolve));
  assert.match(el('status').textContent,/地圖.*怪物/);
  assert.match(el('results').innerHTML,/紫晶飛龍|Amethyst Wyvern/);
  assert.match(el('results').innerHTML,/穿透/);
  const leader=db.monsters.find(m=>m.map==='Amethyst Hollows'&&m.leader);
  if(leader)assert.ok(!el('results').innerHTML.includes(leader.nameZh+'</h3>'));
  el('monster').value='monster-amethyst-wyvern';
  el('monster').listeners.change();
  el('observed').value='100000';
  el('observed').listeners.input();
  assert.match(el('results').innerHTML,/理論兩擊門檻/);
  assert.match(el('results').innerHTML,/100,000/);
  el('monster').value='';
  el('monster').listeners.change();
  assert.equal(el('observed').value,'');
  el('hit').value='';
  el('hit').listeners.input();
  assert.match(el('status').textContent,/有效的非負數值/);
});
