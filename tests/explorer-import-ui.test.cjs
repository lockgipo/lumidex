const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'tradeoff.html'),'utf8');
const app=html.split('<script>').at(-1).split('</script>')[0];
test('LumiDex offers a no-extension, name-based import and keeps gear comparison',()=>{
  for(const id of ['character-name','open-explorer','import-status','import-profile','equipped-select','candidate-search','candidate-select','candidate-count','gear-delta','apply-delta'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/免安裝腳本/);
  assert.match(html,/meta name="lumidex-explorer-api"/);
  assert.doesNotMatch(html,/<a[^>]+href="explorer-bridge\.user\.js"/);
  assert.match(app,/async function importCharacterDirect\(/);
  assert.match(app,/fetch\(api\.href/);
  assert.match(app,/credentials:'omit'/);
  assert.match(app,/LumiExplorerImport\.normalize\(payload,name\)/);
  assert.match(app,/LumiExplorerImport\.suggest\(values,selectedDelta/);
  assert.doesNotMatch(app,/window\.open\(|window\.opener|bridgeTab/);
  assert.doesNotMatch(app,/localStorage|sessionStorage/);
  assert.doesNotThrow(()=>new Function(app));
});
test('configured endpoint is verified and unavailable endpoints show clear feedback',()=>{
  assert.match(html,/<meta name="lumidex-explorer-api" content="https:\/\/lumidex-explorer-api\.vercel\.app\/api\/player">/);
  assert.match(app,/button\.disabled=true/);
  assert.match(app,/一鍵匯入服務準備中/);
});

test('mobile picker displays ability cards, class/source filters and set unknown note without popups',()=>{
 for(const id of ['candidate-list','gear-sort','gear-source','job-filter','hide-unsafe','set-status','load-more-candidates','equipped-summary'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/src="gear-picker\.js"/);
 assert.match(app,/LumiGearPicker\.relatedCandidates/);
 assert.match(app,/LumiGearPicker\.inferJobFromEquipped/);
 assert.match(html,/官方 Explorer 未提供個別裝備套裝名稱/);
 assert.doesNotMatch(app,/window\.open\(/);
});
