const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const page=fs.readFileSync(path.join(root,'damage.html'),'utf8');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=page.split('<script>').at(-1).split('</script>')[0];
const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);

test('main navigation only advertises the v0.8.6 quick calculator, legacy files are intact',()=>{
 assert.match(home,/href="damage\.html"/);
 assert.doesNotMatch(home,/href="analyzer\.html"|href="tradeoff\.html"/);
 assert.doesNotMatch(page,/href="tradeoff\.html"/);
 for(const name of ['tradeoff.html','analyzer.html','explorer-import.js','gear-picker.js','gear-sets.js']){
  assert.ok(fs.existsSync(path.join(root,name)),name);
 }
});

test('eight A/B inputs open an accessible quick editor without summoning the native keypad',()=>{
 for(const id of ['a-pierce','b-pierce','a-atk','b-atk','a-crit','b-crit','a-flat','b-flat']){
  const input=page.match(new RegExp('<input[^>]+id="'+id+'"[^>]*>'))?.[0];
  assert.ok(input,'missing input '+id);
  assert.match(input, /readonly/);
  assert.match(input, /role="button"/);
  assert.match(input, /aria-haspopup="dialog"/);
  assert.match(input, /data-quick=/);
 }
 for(const id of ['editor-backdrop','delta-editor','editor-close','editor-title','editor-value','editor-sign','editor-zero','editor-exact-toggle','editor-exact','editor-apply','editor-error','editor-precise','swap-gears','copy-a-to-b']){
  assert.ok(ids.includes(id),id);
 }
 assert.equal(new Set(ids).size,ids.length,'duplicate element IDs');
 assert.match(page,/role="dialog"/);
 assert.match(page,/aria-modal="true"/);
 for(const step of ['-10','-5','-1','1','5','10'])
  assert.ok(page.includes('data-step="'+step+'"'),step);
 assert.match(page,/safe-area-inset-bottom/);
 assert.doesNotThrow(()=>new Function(script));
});

test('quick controls use one shared model and preserve existing stored settings',()=>{
 assert.match(script,/function openQuickEditor\(/);
 assert.match(script,/function closeQuickEditor\(/);
 assert.match(script,/function changeQuickValue\(/);
 assert.match(script,/function swapGears\(/);
 assert.match(script,/function copyGearAtoB\(/);
 assert.match(script,/document\.addEventListener\('keydown'/);
 assert.match(script,/function inputChanged\(/);
 assert.match(script,/localStorage\.setItem\(KEY/);
 assert.match(script,/lumidex-damage-v1/);
 assert.doesNotMatch(script,/fetch\(.*(?:explorer|vercel|api\/player)/);
});
