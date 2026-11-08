const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'tradeoff.html'),'utf8');
const bridge=fs.readFileSync(path.join(root,'explorer-bridge.user.js'),'utf8');
const app=html.split('<script>').at(-1).split('</script>')[0];

test('A/B page provides name-first gear import with automatic bridge and JSON fallback',()=>{
  for(const id of ['character-name','open-explorer','import-paste','import-paste-button','import-status',
    'import-profile','equipped-select','candidate-search','candidate-select','candidate-count','gear-delta','apply-delta'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.ok(html.includes('src="explorer-import.js"'));
  assert.ok(html.includes('href="explorer-bridge.user.js"'));
  assert.ok(html.includes('type="button"'));
  assert.doesNotThrow(()=>new Function(app));
  assert.match(app,/event\.source!==bridgeTab/);
  assert.match(app,/event\.origin/);
  assert.match(app,/LumiExplorerImport\.normalize\(payload,name\)/);
  assert.match(app,/LumiExplorerImport\.suggest\(values,selectedDelta/);
  assert.doesNotMatch(app,/localStorage|sessionStorage/);
});

test('Explorer Userscript uses same-origin fetch and only sends a minimized public gear payload',()=>{
  assert.match(bridge,/@match\s+https:\/\/lumivaraonline\.com\/explorer\/\*/);
  assert.match(bridge,/@grant\s+none/);
  assert.match(bridge,/event\.source!==window\.opener/);
  assert.match(bridge,/allowedOrigin\(event\.origin\)/);
  assert.match(bridge,/\/api\/explorer\/player\?name=/);
  assert.match(bridge,/gear:minimalistGear\(p\.gear\)/);
  assert.match(bridge,/storage:\{gear:minimalistGear\(p\.storage\?\.gear\)\}/);
  assert.doesNotMatch(bridge,/silver:p\.silver|gold:p\.gold|inventory:p\.inventory|localStorage/);
  const script=bridge.replace(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/,'');
  assert.doesNotThrow(()=>new Function(script));
});
