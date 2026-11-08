const test=require('node:test');
const assert=require('node:assert/strict');
const live=process.env.LUMIDEX_EXPLORER_SMOKE==='1';
const base=(process.env.LUMIDEX_EXPLORER_API_BASE||'https://lumidex-explorer-api.vercel.app/api/player')+'?name=Gipo';
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
  if(process.env.LUMIDEX_GEAR_SCHEMA_SMOKE==='1'){
    assert.equal(data.player.classId,'archer');
    assert.ok(data.player.gear.some(x=>typeof x.template==='string'),'template omitted');
    assert.ok(data.player.gear.some(x=>typeof x.serial==='string'),'serial omitted');
    assert.ok(data.player.gear.some(x=>Array.isArray(x.top)),'top omitted');
    assert.ok(data.player.gear.every(x=>!Object.hasOwn(x,'finder')),'finder leaked');
  }
});
test('deployed Explorer API rejects non-LumiDex origins and handles OPTIONS',{skip:!live},async()=>{
  const rejected=await fetch(base,{headers:{Origin:'https://invalid.example'},signal:AbortSignal.timeout(14000)});
  assert.equal(rejected.status,403);
  assert.equal(rejected.headers.get('access-control-allow-origin'),null);
  const preflight=await fetch(base,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'GET'},signal:AbortSignal.timeout(14000)});
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
});