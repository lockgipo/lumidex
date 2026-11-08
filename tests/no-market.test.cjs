const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];
const data=require('../data.json');

test('user-facing card market UI and price calculations are removed while NPC sale values remain',()=>{
  for(const term of ['market-region','market-import','market-form','market-snapshot.js','最低掛賣價','7 日成交均價','marketCompact','marketPanel','marketRecord','avg7Sold','lumidex-v04-market','data-market-clear']) {
    assert.ok(!html.includes(term),'Unexpected market feature: '+term);
  }
  assert.ok(!html.includes('value="ask"'));
  assert.ok(!html.includes('value="avg7"'));
  assert.ok(html.includes('NPC 收購價'));
  assert.ok(html.includes('NPC 價值高→低'));
  assert.ok(data.cards.every(card=>card.npcSell!=null));
  assert.ok(data.materials.every(material=>material.npcSell!=null));
  assert.ok(html.includes('card-filters.js'));
  assert.doesNotThrow(()=>new vm.Script(app));
});

test('market UI removal does not erase legacy browser records',()=>{
  const previous=JSON.stringify({'SEA|card-prism-hopper':{lowestAsk:999,source:'manual'}});
  const store=new Map([
    ['lumidex-v04-market',previous],
    ['lumidex-v04-region','SEA'],
    ['lumidex-v1-favs',JSON.stringify(['card-prism-hopper'])]
  ]);
  const elements=new Map();
  const dom={
    firstChild:{textContent:''},value:'',checked:false,innerHTML:'',textContent:'',
    classList:{toggle(){},contains(){return false},remove(){}},
    addEventListener(){},querySelectorAll(){return []},appendChild(){},closest(){return this},
    focus(){},setAttribute(){},selectedOptions:[{textContent:'全部來源'}]
  };
  function query(s){if(!elements.has(s))elements.set(s,{...dom,firstChild:{textContent:''},classList:{...dom.classList}});return elements.get(s)}
  const ctx=vm.createContext({
    document:{body:{style:{}},getElementById:()=>({textContent:JSON.stringify(data)}),querySelector:query,querySelectorAll:()=>[],createElement:()=>({}),addEventListener(){}},
    window:{addEventListener(){}},
    location:{hash:''},
    localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},
  });
  vm.runInContext(fs.readFileSync(path.join(root,'card-filters.js'),'utf8'),ctx);
  vm.runInContext(app,ctx);
  assert.equal(store.get('lumidex-v04-market'),previous);
  assert.equal(store.get('lumidex-v04-region'),'SEA');
  assert.equal(store.get('lumidex-v1-favs'),'["card-prism-hopper"]');
  assert.match(query('#results').innerHTML,/card-prism-hopper/);
  assert.match(query('#results').innerHTML,/data-open="card-golden-fox"/);
});
