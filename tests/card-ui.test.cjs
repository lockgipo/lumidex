const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const data=require('../data.json');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];

test('category and source controls filter rendered cards without changing saved favorites',()=>{
  const elements=new Map();
  const handlers={};
  const storage=new Map([['lumidex-v1-favs',JSON.stringify(['card-golden-fox'])]]);
  function elem(selector){
    if(!elements.has(selector)){
      elements.set(selector,{
        value:'',checked:false,disabled:false,hidden:false,innerHTML:'',textContent:'',
        dataset:{},style:{},firstChild:{textContent:''},selectedOptions:[{textContent:'已核對怪物掉落'}],
        classList:{toggle(){},remove(){},add(){},contains(){return false;}},
        addEventListener(type,cb){this['on_'+type]=cb;},
        querySelectorAll(){return [];},appendChild(){},closest(){return this;},focus(){},
      });
    }
    return elements.get(selector);
  }
  const context=vm.createContext({
    document:{
      body:{style:{}},
      getElementById:id=>({textContent:JSON.stringify(data)}),
      querySelector:elem,
      querySelectorAll:()=>[],
      createElement:()=>({}),
      addEventListener(type,cb){(handlers[type]??=[]).push(cb)}
    },
    window:{addEventListener(){}},
    localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
    history:{replaceState(){}},
    location:{hash:'',pathname:'/index.html',search:''}
  });
  vm.runInContext(fs.readFileSync(path.join(root,'card-filters.js'),'utf8'),context);
  vm.runInContext(app,context);

  assert.match(elem('#result-count').textContent,/100 筆結果/);
  elem('#effect-buttons').on_click({target:{closest:()=>({dataset:{effect:'atk'}})}});
  assert.match(elem('#effect-count').textContent,/已選 1 項/);
  assert.doesNotMatch(elem('#results').innerHTML,/data-open="card-prism-hopper"/);
  elem('#effect-buttons').on_click({target:{closest:()=>({dataset:{effect:'piercePhysical'}})}});
  assert.match(elem('#effect-count').textContent,/已選 2 項/);
  assert.match(elem('#results').innerHTML,/data-open="card-golden-fox"/);
  assert.match(elem('#results').innerHTML,/data-open="card-sunfire-colossus"/);
  assert.doesNotMatch(elem('#results').innerHTML,/data-open="card-thorn-pixie"/);
  assert.equal(storage.get('lumidex-v1-favs'),'["card-golden-fox"]');

  elem('#reset-effects').on_click();
  assert.match(elem('#result-count').textContent,/100 筆結果/);
  assert.equal(elem('#effect-count').textContent,'點選展開，可複選');

  // Selecting one detail narrows results; two in the same group means either.
  const choose=value=>elem('#effect-buttons').on_click({target:{closest:()=>({dataset:{effectOption:value}})}});
  choose('baseStat:str');
  assert.match(elem('#effect-count').textContent,/已選 1 項/);
  assert.match(elem('#result-count').textContent,/5 筆結果/);
  choose('baseStat:dex');
  assert.match(elem('#result-count').textContent,/9 筆結果/);
  assert.match(elem('#effect-count').textContent,/已選 2 項/);
  choose('baseStat:str');
  assert.match(elem('#result-count').textContent,/4 筆結果/);
  choose('hpSp:hp');
  assert.match(elem('#effect-count').textContent,/已選 2 項/);
  elem('#reset-effects').on_click();
  assert.match(elem('#result-count').textContent,/100 筆結果/);
  choose('defense:def');
  assert.match(elem('#result-count').textContent,/9 筆結果/);
  choose('defense:mdef');
  assert.match(elem('#effect-count').textContent,/已選 2 項/);
  elem('#reset-effects').on_click();

  const map='Amethyst Hollows';
  const mapEvent={target:{closest(selector){if(selector==='[data-farm-map],[data-farm-mon]')return {dataset:{farmMap:map}};return null}}};
  for(const cb of handlers.click||[])cb(mapEvent);
  assert.equal(elem('#mapfilter').value,map);
  assert.equal(elem('#sourcefilter').value,'verifiedMonster');
  assert.match(elem('#advanced-count').textContent,/2 項/);
  assert.match(elem('#filter-hint').textContent,/已核對怪物掉落/);
  assert.match(elem('#results').innerHTML,/data-open="card-amethyst-wyvern"/);
  assert.doesNotMatch(elem('#results').innerHTML,/data-open="card-golden-fox"/);

  const monsterEvent={target:{closest(selector){if(selector==='[data-farm-map],[data-farm-mon]')return {dataset:{farmMon:'monster-amethyst-wyvern'}};return null}}};
  for(const cb of handlers.click||[])cb(monsterEvent);
  assert.match(elem('#farming-label').textContent,/紫晶飛龍/);
  assert.match(elem('#results').innerHTML,/data-open="card-amethyst-wyvern"/);
  elem('#clear-farming').on_click();
  assert.equal(elem('#farming-label').textContent.includes('只看'),true);
  elem('#reset-advanced').on_click();
  assert.equal(elem('#sourcefilter').value,'all');
  assert.equal(elem('#mapfilter').value,'');
  assert.equal(elem('#slotfilter').value,'');
  assert.equal(elem('#advanced-count').textContent,'');
  assert.match(elem('#result-count').textContent,/100 筆結果/);
  assert.equal(storage.get('lumidex-v1-favs'),'["card-golden-fox"]');
});
