// LumiDex fixed-origin read-only proxy for Lumivara Explorer public equipment.
// No credentials, player records, or arbitrary destination URLs.
const origins=new Set(["https://lockgipo.github.io"]);
const namePattern=/^[\p{L}\p{N}_ .-]{1,24}$/u;
function headers(origin){
  const h=new Headers({"content-type":"application/json; charset=utf-8","cache-control":"public,max-age=30","x-content-type-options":"nosniff","vary":"Origin"});
  if(origins.has(origin)){
    h.set("access-control-allow-origin",origin);
    h.set("access-control-allow-methods","GET, OPTIONS");
    h.set("access-control-allow-headers","content-type");
    h.set("access-control-max-age","600");
  }
  return h;
}
function response(body,status,origin){
  return new Response(body===null?null:JSON.stringify(body),{status,headers:headers(origin)});
}
function cleanGear(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
  const bonuses={};
  for(const [k,v] of Object.entries(raw.bonuses||{})){
    if(/^[a-z][A-Za-z0-9]{0,31}$/.test(k)&&typeof v==="number"&&Number.isFinite(v)&&Math.abs(v)<=100000)bonuses[k]=v;
  }
  return {
    name:typeof raw.name==="string"?raw.name.slice(0,120):"",
    slot:typeof raw.slot==="string"?raw.slot.slice(0,32):"",
    tier:Number.isFinite(raw.tier)?raw.tier:null,
    refine:Number.isFinite(raw.refine)?raw.refine:0,
    worn:raw.worn===true,
    bonuses,
    cards:Array.isArray(raw.cards)?raw.cards.filter(x=>typeof x==="string").slice(0,6).map(x=>x.slice(0,80)):[]
  };
}
function sanitized(input,expected){
  const p=input?.player;
  if(!p||typeof p.name!=="string"||p.name.toLocaleLowerCase()!==expected.toLocaleLowerCase()||!Array.isArray(p.gear)||p.gear.length>5000)return null;
  const stored=p.storage?.gear;
  if(stored!==undefined&&(!Array.isArray(stored)||stored.length>5000))return null;
  return {player:{
    name:p.name.slice(0,24),level:Number.isInteger(p.level)?p.level:null,classId:Number.isInteger(p.classId)?p.classId:null,
    gear:p.gear.map(cleanGear).filter(Boolean),storage:{gear:(stored||[]).map(cleanGear).filter(Boolean)}
  }};
}
export default {
  async fetch(request,env={}){
    const origin=request.headers.get("origin")||"";
    const url=new URL(request.url);
    if(url.pathname!=="/api/player")return response({error:"not_found"},404,origin);
    if(!origins.has(origin))return response({error:"forbidden"},403,origin);
    if(request.method==="OPTIONS")return response(null,204,origin);
    if(request.method!=="GET")return response({error:"method_not_allowed"},405,origin);
    const name=url.searchParams.get("name")?.trim()||"";
    if(!namePattern.test(name)||url.searchParams.size!==1)return response({error:"invalid_name"},400,origin);
    try{
      const upstream=await (env.SOURCE_FETCH||fetch)("https://lumivaraonline.com/api/explorer/player?name="+encodeURIComponent(name),{
        method:"GET",headers:{accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(12000),
        cf:{cacheEverything:true,cacheTtl:30}
      });
      if(!upstream.ok)return response({error:"upstream_unavailable"},502,origin);
      const length=Number(upstream.headers.get("content-length")||0);
      if(length>3_000_000)return response({error:"upstream_large"},502,origin);
      const text=await upstream.text();
      if(text.length>3_000_000)return response({error:"upstream_large"},502,origin);
      const payload=sanitized(JSON.parse(text),name);
      if(!payload)return response({error:"upstream_invalid"},502,origin);
      return response(payload,200,origin);
    }catch{
      return response({error:"upstream_unavailable"},502,origin);
    }
  }
};
