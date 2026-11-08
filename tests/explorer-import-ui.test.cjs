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
 assert.match(html,/匯入的裝備不包含套裝歸屬及加成/);
 assert.doesNotMatch(app,/window\.open\(/);
});

test('optional manual set panel has A/B independent rows, activation and explicit opt-in',()=>{
 for(const id of ['gear-set-panel','set-rows-A','set-rows-B','add-set-A','add-set-B','set-summary-A','set-summary-B','copy-sets','set-enabled','set-error'])
   assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/套裝效果需手動設定/);
 assert.match(html,/官方 Explorer 匯入資料不包含裝備的套裝歸屬/);
 assert.match(html,/2 件、4 件或 6 件/);
 assert.match(html,/不含套裝加成的基礎值/);
 assert.match(html,/src="gear-sets\.js"/);
 assert.match(app,/LumiGearSets\.calculate\(setRows\.A\)/);
 assert.match(app,/LumiGearSets\.calculate\(setRows\.B\)/);
 assert.match(app,/LumiGearSets\.apply\(manualA,sets\.A\)/);
 assert.match(app,/LumiGearSets\.apply\(manualB,sets\.B\)/);
 assert.match(app,/opt\.setCritUnknown=/);
 assert.match(app,/opt\.setDamageFactorA=/);
 assert.match(app,/opt\.setDamageFactorB=/);
 assert.match(app,/setRows\.B=setRows\.A\.map/);
 assert.doesNotMatch(app,/localStorage|sessionStorage/);
 assert.doesNotThrow(()=>new Function(app));
});
