const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const uri=pathToFileURL(path.join(__dirname,'../edge/explorer-proxy.mjs')).href;
const origin='https://lockgipo.github.io';
const sample={player:{name:'Gipo',classId:'archer',level:99,gear:[{name:'A',slot:'accessory1',worn:true,serial:'example-gear-001',template:'obsidian_ring',top:['pierce'],finder:'other_player',bonuses:{pierce:3}}],storage:{gear:[{name:'B',slot:'accessory1',bonuses:{critDmg:8}}]},silver:987654,account:'private'}};
async function run(path,init={},source=()=>new Response(JSON.stringify(sample),{headers:{'content-type':'application/json'}})){
 const m=await import(uri);const calls=[];
 const req=new Request('https://worker.example'+path,{headers:{origin},...init});
 const response=await m.default.fetch(req,{SOURCE_FETCH:(url,opt)=>{calls.push(url);return source(url,opt)}},{});
 return {response,body:response.status===204?null:await response.json(),calls};
}
test('proxy sends only public gear from fixed official upstream',async()=>{
 const r=await run('/api/player?name=Gipo');
 assert.equal(r.response.status,200);
 assert.equal(r.response.headers.get('access-control-allow-origin'),origin);
 assert.equal(r.body.player.gear[0].worn,true);
 assert.equal(r.body.player.classId,'archer');
 assert.equal(r.body.player.level,99);
 assert.equal(r.body.player.gear[0].serial,'example-gear-001');
 assert.equal(r.body.player.gear[0].template,'obsidian_ring');
 assert.deepEqual(r.body.player.gear[0].top,['pierce']);
 assert.equal('finder' in r.body.player.gear[0],false);
 assert.equal(r.body.player.storage.gear[0].name,'B');
 assert.ok(!JSON.stringify(r.body).includes('987654'));
 assert.ok(!JSON.stringify(r.body).includes('private'));
 assert.deepEqual(r.calls,['https://lumivaraonline.com/api/explorer/player?name=Gipo']);
});
test('rejects non-LumiDex origin, arbitrary URLs and invalid names',async()=>{
 let r=await run('/api/player?name=Gipo',{headers:{origin:'https://attacker.example'}});
 assert.equal(r.response.status,403);assert.equal(r.calls.length,0);
 for(const path of ['/api/player?name=%3Cscript%3E','/api/player?name=https%3A%2F%2Fexample.com','/api/player','/api/http?name=Gipo']){
   r=await run(path);assert.equal(r.calls.length,0);
   assert.ok(r.response.status>=400);
 }
 r=await run('/api/player?name=Gipo',{method:'POST'});assert.equal(r.response.status,405);
});
test('OPTIONS and invalid upstream are safe',async()=>{
 let r=await run('/api/player?name=Gipo',{method:'OPTIONS'});
 assert.equal(r.response.status,204);assert.equal(r.response.headers.get('access-control-allow-methods'),'GET, OPTIONS');
 r=await run('/api/player?name=Gipo',{},()=>new Response('oops',{status:500}));
 assert.equal(r.response.status,502);
 r=await run('/api/player?name=Gipo',{},()=>new Response(JSON.stringify({player:{name:'wrong',gear:[]}})));
 assert.equal(r.response.status,502);
});
