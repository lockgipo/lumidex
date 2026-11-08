const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.join(__dirname,'../api/player.mjs')).href;
test('Vercel route uses same validated Explorer proxy',async()=>{
  const mod=await import(url);
  const result=await mod.default.fetch(new Request('https://lumi-vercel.example/api/player?name=Gipo',{
    headers:{origin:'https://invalid.example'}
  }));
  assert.equal(result.status,403);
  assert.equal((await result.json()).error,'forbidden');
});
