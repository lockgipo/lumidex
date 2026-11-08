// ==UserScript==
// @name         LumiDex Explorer 角色裝備匯入橋接
// @namespace    https://github.com/lockgipo/lumidex
// @version      0.8.1
// @description  在官方 Explorer 同網域讀取公開角色裝備，僅在你開啟 LumiDex 匯入流程時傳回裝備資料，不修改遊戲。
// @match        https://lumivaraonline.com/explorer/*
// @match        https://www.lumivaraonline.com/explorer/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
(function(){
  'use strict';
  const params=new URLSearchParams(location.search);
  const name=(params.get('name')||'').trim();
  if(params.get('lumidex')!=='1'||!name||name.length>24)return;
  const allowedOrigin=(origin)=>{
    if(['https://lockgipo.github.io','https://htmlpreview.github.io'].includes(origin))return true;
    try{
      const u=new URL(origin);
      return u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname);
    }catch{return false}
  };
  let pending=false;
  const panel=document.createElement('div');
  panel.id='lumidex-explorer-bridge';
  Object.assign(panel.style,{position:'fixed',right:'12px',bottom:'20px',zIndex:'2147483647',
    background:'#17283b',color:'#e4fff7',border:'1px solid #6ad3bf',
    padding:'12px 14px',maxWidth:'min(370px,calc(100vw - 24px))',
    borderRadius:'12px',boxShadow:'0 15px 35px #0009',
    font:'13px/1.55 system-ui,-apple-system,sans-serif'});
  const title=document.createElement('strong');
  title.textContent='LumiDex · Explorer 匯入';
  const message=document.createElement('div');
  message.textContent='準備讀取官方公開裝備（不含貨幣或背包消耗品）。';
  message.style.margin='6px 0';
  const copyButton=document.createElement('button');
  copyButton.type='button';copyButton.textContent='複製匯入資料（備援）';
  Object.assign(copyButton.style,{padding:'9px 12px',borderRadius:'8px',
    border:'1px solid #5dc4b6',background:'#23564e',color:'#fff',
    font:'inherit',cursor:'pointer'});
  panel.append(title,message,copyButton);
  document.body.appendChild(panel);
  function minimalistGear(list){
    if(!Array.isArray(list))return [];
    return list.slice(0,5000).map(g=>({
      name:g?.name,serial:g?.serial,slot:g?.slot,tier:g?.tier,refine:g?.refine,
      worn:g?.worn===true,cards:g?.cards,bonuses:g?.bonuses
    }));
  }
  async function load(){
    const res=await fetch('/api/explorer/player?name='+encodeURIComponent(name),{
      method:'GET',credentials:'omit',cache:'no-store',
      headers:{accept:'application/json'}
    });
    if(!res.ok)throw new Error('官方資料讀取失敗：HTTP '+res.status);
    const data=await res.json(),p=data.player;
    if(!p||String(p.name).toLowerCase()!==name.toLowerCase()||!Array.isArray(p.gear))throw new Error('角色名稱或裝備資料不一致');
    // Exclude silver, gold, inventory, records, purchases and other unrelated player data.
    return {player:{name:p.name,level:p.level,classId:p.classId,
      gear:minimalistGear(p.gear),storage:{gear:minimalistGear(p.storage?.gear)}
    }};
  }
  async function send(origin){
    if(pending)return;
    pending=true;message.textContent='正在讀取 '+name+' 的公開裝備…';
    try{
      const payload=await load();
      window.opener?.postMessage({type:'lumidex:character',name,payload},origin);
      message.textContent='已傳回 LumiDex：'+payload.player.gear.filter(g=>g.worn).length+' 件穿戴裝備。';
    }catch(err){
      message.textContent='讀取失敗：'+err.message+'，請使用下方手動複製。';
      window.opener?.postMessage({type:'lumidex:error',name,error:String(err.message).slice(0,160)},origin);
    }finally{pending=false;}
  }
  window.addEventListener('message',event=>{
    if(!allowedOrigin(event.origin)||event.source!==window.opener)return;
    if(event.data?.type==='lumidex:request' && String(event.data.name).toLowerCase()===name.toLowerCase()){
      send(event.origin);
    }
  });
  // 'ready' exposes only the public character name; never send gear to an unverified origin.
  if(window.opener){
    for(const ms of [100,600,1600]){
      setTimeout(()=>{try{window.opener?.postMessage({type:'lumidex:ready',name},'*')}catch{}},ms);
    }
  }else{
    message.textContent='未偵測到來源分頁。可以點下方複製，再貼回 LumiDex。';
  }
  copyButton.addEventListener('click',async()=>{
    try{
      message.textContent='正在準備匯入資料…';
      const payload=await load();
      const text=JSON.stringify(payload);
      try{
        await navigator.clipboard.writeText(text);
        message.textContent='已複製公開裝備 JSON，返回 LumiDex 貼上即可匯入。';
      }catch{
        let area=document.getElementById('lumidex-copy-area');
        if(!area){area=document.createElement('textarea');area.id='lumidex-copy-area';area.readOnly=true;
          area.style.width='100%';area.style.height='90px';panel.appendChild(area);}
        area.value=text;area.focus();area.select();
        message.textContent='請複製下方已選取的文字，再返回 LumiDex 貼上。';
      }
    }catch(err){message.textContent='讀取失敗：'+err.message;}
  });
})();
