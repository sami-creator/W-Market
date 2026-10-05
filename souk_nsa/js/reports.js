/* reports.js — إبلاغ: يستخدم APP.REPORT_REASONS من config.js */
'use strict';
(function(){

  const lang = document.documentElement.lang||'ar';

  /* يُستدعى من ad-details.js أيضاً عبر showReportMenu */
  window.REPORTS = {

    /* فتح موديل الإبلاغ مباشرة */
    open(adId){
      const existing=document.getElementById('report-modal');
      if(existing) existing.remove();
      const reasons=window.APP?.REPORT_REASONS||[];

      const modal=document.createElement('div');
      modal.id='report-modal';
      modal.className='modal-overlay';
      modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      modal.innerHTML=`
        <div class="modal">
          <h3 style="margin:0 0 12px">${({ar:'إبلاغ عن الإعلان',fr:"Signaler l'annonce",en:'Report ad'})[lang]}</h3>
          <div id="rp-reasons">
            ${reasons.map(r=>`
              <button class="btn btn--ghost btn--block" style="margin-bottom:6px;text-align:start" data-reason="${r.id}">
                ${r.label[lang]||r.label.ar}
              </button>`).join('')}
          </div>
          <div id="rp-sub" hidden></div>
          <div id="rp-other" hidden>
            <textarea class="input" id="rp-other-text"
              placeholder="${({ar:'اكتب السبب...',fr:'Décrivez...',en:'Describe...'})[lang]}"
              rows="3" maxlength="500"></textarea>
          </div>
          <div class="modal__row">
            <button class="btn btn--ghost" id="rp-cancel">${({ar:'إلغاء',fr:'Annuler',en:'Cancel'})[lang]}</button>
            <button class="btn btn--danger" id="rp-submit" disabled>${({ar:'إرسال',fr:'Envoyer',en:'Send'})[lang]}</button>
          </div>
        </div>`;

      document.body.appendChild(modal);
      modal.querySelector('#rp-cancel').addEventListener('click',()=>modal.remove());
      modal.addEventListener('click',e=>{ if(e.target===modal) modal.remove(); });

      let selReason='', selSub='';

      modal.querySelectorAll('[data-reason]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          selReason=btn.dataset.reason; selSub='';
          modal.querySelectorAll('[data-reason]').forEach(b=>b.style.background='');
          btn.style.background='var(--c-soft)';

          const subDiv=modal.querySelector('#rp-sub');
          const otherDiv=modal.querySelector('#rp-other');
          subDiv.hidden=true; otherDiv.hidden=true;
          modal.querySelector('#rp-submit').disabled=true;

          const reason=reasons.find(r=>r.id===selReason);
          if(selReason==='other'){
            otherDiv.hidden=false;
            modal.querySelector('#rp-other-text').addEventListener('input',e=>{
              modal.querySelector('#rp-submit').disabled=!e.target.value.trim();
            });
          } else if(reason?.sub){
            const subs=reason.sub[lang]||reason.sub.ar||[];
            subDiv.innerHTML=`<p style="font-size:13px;margin:8px 0 4px">${({ar:'تفصيل:',fr:'Précisez:',en:'Specify:'})[lang]}</p>`+
              subs.map(s=>`<button class="btn btn--ghost" style="margin:3px;font-size:13px" data-sub="${s}">${s}</button>`).join('');
            subDiv.hidden=false;
            subDiv.querySelectorAll('[data-sub]').forEach(sb=>{
              sb.addEventListener('click',()=>{
                selSub=sb.dataset.sub;
                subDiv.querySelectorAll('[data-sub]').forEach(x=>x.style.background='');
                sb.style.background='var(--c-soft)';
                modal.querySelector('#rp-submit').disabled=false;
              });
            });
          } else {
            modal.querySelector('#rp-submit').disabled=false;
          }
        });
      });

      modal.querySelector('#rp-submit').addEventListener('click',async()=>{
        const other=modal.querySelector('#rp-other-text')?.value.trim()||'';
        await submitReport(adId, selReason, selSub||other);
        modal.remove();
        window.UI?.toast(({ar:'تم الإبلاغ، شكراً',fr:'Signalement envoyé',en:'Report sent'})[lang],'success');
      });
    }
  };

  async function submitReport(adId, reason, sub){
    const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
    if(!base||!key) return;
    try{
      await fetch(`${base}/rest/v1/reports`,{
        method:'POST',
        headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'},
        body:JSON.stringify({
          ad_id:adId, reason, sub,
          reporter_id:window.__auth_user?.id||null,
          created_at:new Date().toISOString()
        })
      });
    }catch(e){ console.error('[reports]',e); }
  }

})();
