/* chat.js — دردشة: بطاقة الإعلان في الأعلى + رسائل جاهزة + Realtime */
'use strict';
(function(){

  const lang = document.documentElement.lang||'ar';
  const t = (ar,fr,en)=>({ar,fr,en}[lang]||ar);

  const QUICK_MSGS = [
    t('هل هذا المنتج لا يزال متوفراً؟','Ce produit est-il encore disponible?','Is this item still available?'),
    t('أريد شراء هذا الإعلان','Je souhaite acheter cette annonce','I want to buy this item'),
    t('ما هو أفضل سعر؟','Quel est votre meilleur prix?','What is your best price?'),
    t('هل التوصيل متوفر إلى منطقتي؟','Livrez-vous dans ma région?','Do you deliver to my area?'),
  ];

  let _channel=null;
  let _adCard=null;
  let _messages=[];
  let _page=1;
  let _loadingMore=false;

  /* ===== تهيئة ===== */
  async function init(){
    const root=document.getElementById('chat-root');
    if(!root) return;

    const params=new URLSearchParams(location.search);
    const peerUid=params.get('uid');
    const adId=params.get('ad');

    if(!window.__auth_user){ location.href='auth.html'; return; }

    const myUid=window.__auth_user.id;

    // تحميل بيانات الإعلان إن وجد
    if(adId) _adCard=await fetchAdCard(adId);

    // رسم الهيكل
    root.innerHTML=`
      ${_adCard?renderAdCard(_adCard):''}
      <div id="chat-msgs" class="chat-msgs"></div>
      ${renderQuickMsgs(peerUid,adId)}
      <div class="chat-input">
        <input id="msg-input" class="input grow" type="text"
          placeholder="${t('اكتبي رسالة...','Écrire un message...','Type a message...')}"
          autocomplete="off" maxlength="1000" enterkeyhint="send">
        <button class="btn btn--primary" id="send-btn">➤</button>
      </div>`;

    // تحميل الرسائل
    await loadHistory(myUid, peerUid);

    // إرسال
    document.getElementById('send-btn')?.addEventListener('click',()=>sendMsg(myUid,peerUid,adId));
    document.getElementById('msg-input')?.addEventListener('keydown',e=>{
      if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMsg(myUid,peerUid,adId); }
    });

    // تحميل مزيد عند الصعود
    const msgsDiv=document.getElementById('chat-msgs');
    msgsDiv?.addEventListener('scroll',()=>{
      if(msgsDiv.scrollTop<60&&!_loadingMore) loadMore(myUid,peerUid);
    },{passive:true});

    // Realtime
    subscribeRealtime(myUid,peerUid);
  }

  /* ===== بطاقة الإعلان أعلى المحادثة ===== */
  async function fetchAdCard(adId){
    const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
    if(!base||!key) return null;
    try{
      const r=await fetch(`${base}/rest/v1/ads?id=eq.${adId}&select=id,title,price,thumb`,
        {headers:{'apikey':key,'Authorization':'Bearer '+key}});
      const d=await r.json();
      return d[0]||null;
    }catch(e){ return null; }
  }

  function renderAdCard(ad){
    if(!ad) return '';
    return `
      <div class="chat-ad-card">
        <img src="${ad.thumb||''}" alt="${ad.title||''}" loading="lazy"
          onerror="this.style.display='none'">
        <div class="ad-info">
          <h4>${ad.title||''}</h4>
          <span class="num-ltr">${Number(ad.price||0).toLocaleString('ar-DZ')} دج</span>
        </div>
        <a href="ad-details.html?id=${ad.id}" style="font-size:12px;color:var(--c-primary)">↗</a>
      </div>`;
  }

  /* ===== رسائل جاهزة ===== */
  function renderQuickMsgs(peerUid, adId){
    const btns=QUICK_MSGS.map(m=>
      `<button class="chat-quick-msg" data-msg="${m.replace(/"/g,'&quot;')}">${m}</button>`
    ).join('');
    return `<div class="chat-quick-msgs" id="quick-msgs">${btns}</div>`;
  }

  function bindQuickMsgs(myUid,peerUid,adId){
    document.querySelectorAll('.chat-quick-msg').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const input=document.getElementById('msg-input');
        if(input) input.value=btn.dataset.msg;
        sendMsg(myUid,peerUid,adId);
        document.getElementById('quick-msgs')?.remove(); // إخفاء بعد الإرسال الأول
      });
    });
  }

  /* ===== تحميل السجل ===== */
  async function loadHistory(myUid,peerUid){
    const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
    if(!base||!key) return;
    try{
      const r=await fetch(
        `${base}/rest/v1/messages?or=(and(sender.eq.${myUid},receiver.eq.${peerUid}),and(sender.eq.${peerUid},receiver.eq.${myUid}))&order=created_at.desc&limit=30`,
        {headers:{'apikey':key,'Authorization':'Bearer '+key}}
      );
      const d=await r.json();
      _messages=(Array.isArray(d)?d:[]).reverse();
      renderMessages(myUid,false);
      scrollBottom();
      markRead(myUid,peerUid);
      bindQuickMsgs(myUid,peerUid,null);
    }catch(e){ console.error(e); }
  }

  async function loadMore(myUid,peerUid){
    _loadingMore=true; _page++;
    const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
    try{
      const r=await fetch(
        `${base}/rest/v1/messages?or=(and(sender.eq.${myUid},receiver.eq.${peerUid}),and(sender.eq.${peerUid},receiver.eq.${myUid}))&order=created_at.desc&limit=30&offset=${(_page-1)*30}`,
        {headers:{'apikey':key,'Authorization':'Bearer '+key}}
      );
      const d=await r.json();
      const older=(Array.isArray(d)?d:[]).reverse();
      _messages=[...older,..._messages];
      renderMessages(myUid,true);
    }catch(e){ console.error(e); }
    finally{ _loadingMore=false; }
  }

  /* ===== رسم الرسائل ===== */
  function renderMessages(myUid, prepend=false){
    const box=document.getElementById('chat-msgs');
    if(!box) return;
    const html=_messages.map(m=>{
      const isMe=m.sender===myUid;
      const time=m.created_at?new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
      return `<div class="msg${isMe?' msg--me':''}">
        ${sanitize(m.body||'')}
        <small>${time} ${isMe&&m.read?'✓✓':isMe?'✓':''}</small>
      </div>`;
    }).join('');
    if(prepend){
      const prev=box.scrollHeight;
      box.insertAdjacentHTML('afterbegin',html);
      box.scrollTop=box.scrollHeight-prev;
    } else {
      box.innerHTML=html;
    }
  }

  /* ===== إرسال ===== */
  async function sendMsg(myUid,peerUid,adId){
    const input=document.getElementById('msg-input');
    const body=input?.value.trim();
    if(!body) return;
    input.value='';
    const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
    try{
      const payload={sender:myUid,receiver:peerUid,body,ad_id:adId||null,read:false};
      await fetch(`${base}/rest/v1/messages`,{
        method:'POST',
        headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json','Prefer':'return=representation'},
        body:JSON.stringify(payload)
      });
    }catch(e){ console.error(e); input.value=body; }
  }

  /* ===== Realtime ===== */
  function subscribeRealtime(myUid,peerUid){
    if(!window.supabase) return;
    _channel=window.supabase.channel('chat_'+myUid+'_'+peerUid)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',
        filter:`or(and(sender=eq.${peerUid},receiver=eq.${myUid}),and(sender=eq.${myUid},receiver=eq.${peerUid}))`},
        payload=>{
          _messages.push(payload.new);
          const box=document.getElementById('chat-msgs');
          const atBottom=box&&(box.scrollHeight-box.scrollTop-box.clientHeight)<60;
          renderMessages(myUid,false);
          if(atBottom) scrollBottom();
          markRead(myUid,peerUid);
        })
      .subscribe();
  }

  /* ===== تحديد مقروء ===== */
  async function markRead(myUid,peerUid){
    const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
    try{
      await fetch(`${base}/rest/v1/messages?receiver=eq.${myUid}&sender=eq.${peerUid}&read=eq.false`,{
        method:'PATCH',
        headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'},
        body:JSON.stringify({read:true})
      });
    }catch(e){}
  }

  function scrollBottom(){
    const box=document.getElementById('chat-msgs');
    if(box) box.scrollTop=box.scrollHeight;
  }

  /* ===== تنظيف النص ===== */
  function sanitize(str){
    const d=document.createElement('div');
    d.textContent=str;
    return d.innerHTML;
  }

  window.addEventListener('beforeunload',()=>{ _channel?.unsubscribe(); });

  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded',init);
})();
