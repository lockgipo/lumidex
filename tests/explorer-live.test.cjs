const test=require('node:test');
const assert=require('node:assert/strict');
const live=process.env.LUMIDEX_EXPLORER_SMOKE==='1';
const base='https://lumidex-explorer-api.vercel.app/api/player?name=Gipo';
const origin='https://lockgipo.github.io';
test('deployed Explorer API works from the real LumiDex origin', {skip:!live}, async()=>{
  const response=await fetch(base,{headers:{Origin:origin,Accept:'application/json'},signal:AbortSignal.timeout(18000)});
  assert.equal(response.status,200,'unexpected endpoint status '+response.status);
  assert.equal(response.headers.get('access-control-allow-origin'),origin);
  const data=await response.json();
  assert.equal(data.player?.name,'Gipo');
  assert.ok(data.player.gear.some(item=>item.worn===true),'worn gear missing');
  assert.ok(Array.isArray(data.player.storage.gear));
  assert.ok(!JSON.stringify(data).includes('"silver":'));
});
test('deployed Explorer API rejects non-LumiDex origins and handles OPTIONS',{skip:!live},async()=>{
  const rejected=await fetch(base,{headers:{Origin:'https://invalid.example'},signal:AbortSignal.timeout(14000)});
  assert.equal(rejected.status,403);
  assert.equal(rejected.headers.get('access-control-allow-origin'),null);
  const preflight=await fetch(base,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'GET'},signal:AbortSignal.timeout(14000)});
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
});