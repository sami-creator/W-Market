/* ad-details.js — صفحة تفاصيل الإعلان */
'use strict';
(function(){

  const lang = document.documentElement.lang||'ar';
  const t = (ar,fr,en)=>({ar,fr,en}[lang]||ar);

  /* ===== قراءة ID من URL ===== */
  function getAdId(){
    const p = new URLSearchParams(location.search);
    return p.get('id') || location.pathname.split('/').pop();
  }

  /* ===== تحميل الإعلان ===== */
  async function loadAd(id){
    const base = window.SUPABASE_URL||'';
    const key  = window.SUPABASE_ANON||'';
    if(!base||!key) return null;
    const r = await fetch(
      `${base}/rest/v1/ads?id=eq.${encodeURIComponent(id)}&select=*,profiles(id,name,avatar,verified,online,phone,phone2,phone3,fb,ig,tiktok,telegram,email,wilaya_n,rating,ad_count)`,
      {headers:{'apikey':key,'Authorization':'Bearer '+key}}
    );
    const d = await r.json();
    return Array.isArray(d)&&d[0]?d[0]:null;
  }

  async function loadSimilar(ad){
    const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
    if(!base||!key) return [];
    const r = await fetch(
      `${base}/rest/v1/ads?select=id,title,thumb,price,wilaya_n,discount,is_used,listing_type,negotiable&status=eq.active&cat=eq.${encodeURIComponent(ad.cat||'')}&id=neq.${ad.id}&limit=6`,
      {headers:{'apikey':key,'Authorization':'Bearer '+key}}
    );
    const d=await r.json();
    return Array.isArray(d)?d:[];
  }

  /* ===== رسم الصفحة ===== */
  async function render(){
    const id = getAdId();
    if(!id){ showError(); return; }

    // skeleton
    const body = document.getElementById('detail-body');
    if(body) body.innerHTML=`<div class="sk sk-img" style="height:300px;border-radius:16px"></div><div class="sk sk-line" style="margin-top:10px"></div><div class="sk sk-line sk-short"></div>`;

    let ad;
    try{ ad = await loadAd(id); }catch(e){ showError(); return; }
    if(!ad){ showError(); return; }

    // تسجيل مشاهدة
    trackView(id);

    const seller = ad.profiles||{};
    const lang_  = lang;
    const fmt = n=>Number(n).toLocaleString('ar-DZ');

    /* ===== معرض الصور ===== */
    const imgs = ad.images||[ad.image||''];

    /* ===== سعر الكراء ===== */
    const rentHTML = (ad.listing_type==='rent'||ad.listing_type==='both') && ad.rent_price
      ? `<div class="detail__rent-price">🏷 ${t('سعر الكراء','Prix location','Rent price')}: <span class="num-ltr">${fmt(ad.rent_price)}</span> دج/${t('شهر','mois','month')}</div>`
      : '';

    /* ===== شارات ===== */
    const badges=[];
    if(ad.is_used) badges.push(`<span class="badge badge--used">${t(`مستعمل ${ad.condition_score}/10`,`Usagé ${ad.condition_score}/10`,`Used ${ad.condition_score}/10`)}</span>`);
    if(!ad.negotiable) badges.push(`<span class="badge badge--nego">${t('سعر ثابت','Prix fixe','Fixed price')}</span>`);
    if(ad.negotiable)  badges.push(`<span class="badge badge--nego">${t('قابل للتفاوض','Négociable','Negotiable')}</span>`);
    if(ad.listing_type==='rent') badges.push(`<span class="badge badge--rent">${t('كراء','Location','Rent')}</span>`);
    if(ad.listing_type==='both') badges.push(`<span class="badge badge--rent">${t('بيع/كراء','Vente/Loc','Sale/Rent')}</span>`);

    /* ===== رابط Google Maps ===== */
    const mapURL = ad.map_url||'';
    const mapLabel = ad.location_label||ad.municipality||'';
    const mapHTML = mapURL
      ? `<a class="detail__map-link" href="${mapURL}" target="_blank" rel="noopener">
          <span>📍</span>
          <span>${mapLabel}</span>
          <span style="margin-inline-start:auto;font-size:12px;color:var(--c-primary)">${t('فتح الخريطة','Voir sur Maps','Open Maps')} ↗</span>
        </a>`
      : (mapLabel ? `<div class="detail__map-link"><span>📍</span><span>${mapLabel}</span></div>` : '');

    /* ===== أيقونات التواصل ===== */
    const phones=[seller.phone,seller.phone2,seller.phone3].filter(Boolean);
    const contactHTML = buildContactIcons(seller, phones, ad);

    /* ===== الموقع (ولاية) ===== */
    const wName = (window.APP?.WILAYAS||[]).find(x=>x.n===(ad.wilaya_n||seller.wilaya_n))?.ar||'';
    const kmStr = ad.distance_km?`<span class="num-ltr">${parseFloat(ad.distance_km).toFixed(1)}</span> كم`:'';

    /* ===== HTML الكامل ===== */
    if(body) body.innerHTML = `
      <!-- معرض الصور -->
      <div class="gallery" id="gallery">
        <button class="gallery__menu-btn" id="ad-menu-btn" aria-label="${t('خيارات','Options','Options')}">⋮</button>
        <img class="gallery__main" id="gallery-main" src="${imgs[0]}" alt="${ad.title||''}" loading="eager">
        <div class="gallery__count" id="gallery-count">${imgs.length>1?`1/${imgs.length}`:''}</div>
        ${imgs.length>1?`<button class="gallery__nav gallery__nav--prev" id="g-prev">‹</button><button class="gallery__nav gallery__nav--next" id="g-next">›</button>`:''}
      </div>
      ${imgs.length>1?`<div class="gallery__thumbs" id="gallery-thumbs">${imgs.map((s,i)=>`<img src="${s}" loading="lazy" class="${i===0?'active':''}" data-i="${i}">`).join('')}</div>`:''}

      <!-- بائعة — قابلة للنقر -->
      <div class="detail__seller">
        <a class="av" href="${t('','','')}/profile.html?uid=${seller.id}" aria-label="${seller.name}">
          <img src="${seller.avatar||''}" alt="${seller.name||''}">
          <span class="presence-dot ${seller.online?'on':''}"></span>
        </a>
        <div>
          <a class="detail__seller-name" href="profile.html?uid=${seller.id}">
            ${seller.name||''} ${seller.verified?'<span class="verified-tick">✓</span>':''}
          </a>
          <div class="detail__seller-meta">
            ⭐ ${seller.rating||0} · ${seller.ad_count||0} ${t('إعلان','annonce(s)','ad(s)')}
            ${wName?'· '+wName:''}
          </div>
        </div>
      </div>

      <h1 class="detail__title">${ad.title||''}</h1>

      <!-- السعر -->
      <div class="detail__price">
        <span class="num-ltr">${fmt(ad.price)}</span> دج
        ${ad.old_price?`<del class="num-ltr">${fmt(ad.old_price)} دج</del>`:''}
        ${ad.discount?`<span class="detail__discount">-${Math.abs(ad.discount)}%</span>`:''}
      </div>
      ${rentHTML}

      <!-- شارات -->
      <div class="detail__badges">${badges.join('')}</div>

      <!-- ميتا -->
      <div class="detail__meta">
        <span>⭐ <span class="num-ltr">${ad.rating||0}</span></span>
        <span>❤️ <span class="num-ltr">${ad.likes||0}</span></span>
        <span>👁 <span class="num-ltr">${ad.views||0}</span></span>
        ${kmStr?`<span>📍 ${kmStr}</span>`:''}
        ${wName?`<span>🏙 ${wName}</span>`:''}
        <span>${ad.delivery?'🚚 '+t('توصيل متوفر','Livraison dispo','Delivery'):'❌ '+t('لا توصيل','Sans livraison','No delivery')}</span>
        <span>📅 ${ad.created_at?ad.created_at.slice(0,10):''}</span>
      </div>

      <!-- خريطة -->
      ${mapHTML}

      <!-- تواصل -->
      <div class="detail__contact-row">${contactHTML}</div>

      <!-- وصف -->
      <p class="detail__desc">${(ad.desc||'').replace(/\n/g,'<br>')}</p>
    `;

    /* ===== قسم التقييمات ===== */
    renderReviews(ad);

    /* ===== إعلانات مشابهة ===== */
    renderSimilar(ad);

    /* ===== التذييل ===== */
    renderFooter(ad, seller);

    /* ===== الإجراءات ===== */
    initGallery(imgs);
    initMenuBtn(ad);
    initShare(ad);
    initLike(ad);
  }

  /* ===== أيقونات التواصل ===== */
  function buildContactIcons(seller, phones, ad){
    const icons=[];

    // رقم/واتساب لكل رقم
    phones.forEach(ph=>{
      icons.push(`
        <button class="contact-icon-btn" onclick="window.open('tel:${ph}')" title="${ph}">
          <span style="font-size:18px">📞</span>
        </button>
        <a class="contact-icon-btn" href="https://wa.me/${ph.replace(/^0/,'213')}" target="_blank" rel="noopener" title="WhatsApp ${ph}">
          <img src="data/icons/whatsapp_icon.svg" alt="WhatsApp" onerror="this.replaceWith(document.createTextNode('💬'))">
        </a>`);
    });

    // دردشة داخلية
    icons.push(`<button class="contact-icon-btn" onclick="openChat(${ad.id},'${seller.id}')" title="${t('رسالة','Message','Message')}">
      <img src="data/icons/disc_icon.svg" alt="${t('رسالة','Message','Message')}" onerror="this.replaceWith(document.createTextNode('💬'))">
    </button>`);

    if(seller.fb)       icons.push(`<a class="contact-icon-btn" href="${seller.fb}" target="_blank" rel="noopener" title="Facebook"><img src="data/icons/facebook_icon.svg" alt="Facebook" onerror="this.replaceWith(document.createTextNode('📘'))"></a>`);
    if(seller.ig)       icons.push(`<a class="contact-icon-btn" href="${seller.ig}" target="_blank" rel="noopener" title="Instagram"><img src="data/icons/instagram_icon.svg" alt="Instagram" onerror="this.replaceWith(document.createTextNode('📸'))"></a>`);
    if(seller.tiktok)   icons.push(`<a class="contact-icon-btn" href="${seller.tiktok}" target="_blank" rel="noopener" title="TikTok"><img src="data/icons/tiktok_icon.svg" alt="TikTok" onerror="this.replaceWith(document.createTextNode('🎵'))"></a>`);
    if(seller.telegram) icons.push(`<a class="contact-icon-btn" href="${seller.telegram}" target="_blank" rel="noopener" title="Telegram"><img src="data/icons/telegram_icon.svg" alt="Telegram" onerror="this.replaceWith(document.createTextNode('✈️'))"></a>`);
    if(seller.email)    icons.push(`<a class="contact-icon-btn" href="mailto:${seller.email}" title="Email"><img src="data/icons/gmail_icon.svg" alt="Email" onerror="this.replaceWith(document.createTextNode('📧'))"></a>`);

    return icons.join('');
  }

  /* ===== زر المشاركة ===== */
  function initShare(ad){
    const btn=document.getElementById('share-btn');
    if(!btn) return;
    btn.addEventListener('click',async()=>{
      const url = location.href;
      if(navigator.share){
        try{ await navigator.share({title:ad.title||'', url}); return; }catch(e){}
      }
      await navigator.clipboard.writeText(url);
      window.UI?.toast(t('تم نسخ الرابط','Lien copié','Link copied'),'success');
    });
  }

  /* ===== 3 نقاط — قائمة الإبلاغ ===== */
  function initMenuBtn(ad){
    const btn=document.getElementById('ad-menu-btn');
    if(!btn) return;
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      showReportMenu(ad);
    });
  }

  function showReportMenu(ad){
    const existing = document.getElementById('report-modal');
    if(existing) existing.remove();

    const reasons = window.APP?.REPORT_REASONS||[];
    const lang_=lang;

    const modal = document.createElement('div');
    modal.id='report-modal';
    modal.className='modal-overlay';
    modal.innerHTML=`
      <div class="modal">
        <h3 style="margin:0 0 12px">${t('إبلاغ عن الإعلان','Signaler l\'annonce','Report ad')}</h3>
        <div id="report-reasons">
          ${reasons.map(r=>`
            <button class="btn btn--ghost btn--block" style="margin-bottom:6px;text-align:start" data-reason="${r.id}">
              ${r.label[lang_]||r.label.ar}
            </button>`).join('')}
        </div>
        <div id="report-sub" hidden></div>
        <div id="report-other" hidden>
          <textarea class="input" id="report-other-text" placeholder="${t('اكتب السبب...','Décrivez...','Describe...')}" rows="3"></textarea>
        </div>
        <div class="modal__row">
          <button class="btn btn--ghost" onclick="this.closest('.modal-overlay').remove()">${t('إلغاء','Annuler','Cancel')}</button>
          <button class="btn btn--danger" id="report-submit" disabled>${t('إرسال','Envoyer','Send')}</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    let selectedReason='', selectedSub='';

    modal.querySelectorAll('[data-reason]').forEach(b=>{
      b.addEventListener('click',()=>{
        selectedReason=b.dataset.reason;
        selectedSub='';
        const reason = reasons.find(r=>r.id===selectedReason);

        // إظهار الفروع
        const subDiv=modal.querySelector('#report-sub');
        const otherDiv=modal.querySelector('#report-other');
        subDiv.hidden=true; otherDiv.hidden=true;

        if(selectedReason==='other'){
          otherDiv.hidden=false;
          modal.querySelector('#report-other-text').addEventListener('input',e=>{
            modal.querySelector('#report-submit').disabled=!e.target.value.trim();
          });
        } else if(reason?.sub){
          const subs=reason.sub[lang_]||reason.sub.ar||[];
          subDiv.innerHTML=`<p style="font-size:13px;margin:8px 0 4px">${t('تفصيل أكثر','Précisez','Specify')}:</p>`+
            subs.map(s=>`<button class="btn btn--ghost" style="margin:3px;font-size:13px" data-sub="${s}">${s}</button>`).join('');
          subDiv.hidden=false;
          subDiv.querySelectorAll('[data-sub]').forEach(sb=>{
            sb.addEventListener('click',()=>{
              selectedSub=sb.dataset.sub;
              subDiv.querySelectorAll('[data-sub]').forEach(x=>x.style.background='');
              sb.style.background='var(--c-soft)';
              modal.querySelector('#report-submit').disabled=false;
            });
          });
        } else {
          modal.querySelector('#report-submit').disabled=false;
        }

        modal.querySelectorAll('[data-reason]').forEach(x=>x.style.background='');
        b.style.background='var(--c-soft)';
      });
    });

    modal.querySelector('#report-submit').addEventListener('click',()=>submitReport(ad,selectedReason,selectedSub,modal));
    modal.addEventListener('click',e=>{ if(e.target===modal) modal.remove(); });
  }

  async function submitReport(ad,reason,sub,modal){
    const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
    const other = modal.querySelector('#report-other-text')?.value.trim()||'';
    const user = window.__auth_user;
    try{
      await fetch(`${base}/rest/v1/reports`,{
        method:'POST',
        headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'},
        body:JSON.stringify({ad_id:ad.id, reason, sub: sub||other, reporter_id:user?.id})
      });
    }catch(e){ console.error(e); }
    modal.remove();
    window.UI?.toast(t('تم الإبلاغ، شكراً','Signalement envoyé','Report sent'),'success');
  }

  /* ===== دردشة ===== */
  window.openChat = function(adId,sellerId){
    if(window.ROUTER?.go) window.ROUTER.go(`/chat/${sellerId}?ad=${adId}`);
    else location.href=`chat.html?uid=${sellerId}&ad=${adId}`;
  };

  /* ===== إعجاب ===== */
  function initLike(ad){
    const btn=document.getElementById('detail-like-btn');
    if(!btn) return;
    const liked=window.LIKES?.isLiked(ad.id);
    btn.innerHTML=liked?'❤️':'🤍';
    btn.setAttribute('aria-pressed',liked||false);
    btn.addEventListener('click',()=>{
      if(!window.__auth_user){ window.UI?.toast(t('سجّلي أولاً','Connectez-vous','Sign in first')); return; }
      window.LIKES?.toggle(btn,ad.id);
    });
  }

  /* ===== معرض الصور ===== */
  function initGallery(imgs){
    if(!imgs.length) return;
    let idx=0;
    const main=document.getElementById('gallery-main');
    const count=document.getElementById('gallery-count');
    const thumbs=document.getElementById('gallery-thumbs');

    function go(i){
      idx=(i+imgs.length)%imgs.length;
      if(main) main.src=imgs[idx];
      if(count) count.textContent=`${idx+1}/${imgs.length}`;
      thumbs?.querySelectorAll('img').forEach((t,ti)=>t.classList.toggle('active',ti===idx));
      thumbs?.querySelectorAll('img')[idx]?.scrollIntoView({inline:'center',behavior:'smooth'});
    }

    document.getElementById('g-prev')?.addEventListener('click',()=>go(idx-1));
    document.getElementById('g-next')?.addEventListener('click',()=>go(idx+1));
    thumbs?.querySelectorAll('img').forEach((t,i)=>t.addEventListener('click',()=>go(i)));

    // swipe
    let tx=0;
    const gal=document.getElementById('gallery');
    gal?.addEventListener('touchstart',e=>{ tx=e.touches[0].clientX; },{passive:true});
    gal?.addEventListener('touchend',e=>{
      const dx=e.changedTouches[0].clientX-tx;
      if(Math.abs(dx)>40) go(dx<0?idx+1:idx-1);
    },{passive:true});
  }

  /* ===== تقييمات ===== */
  function renderReviews(ad){
    const sec=document.getElementById('reviews-section');
    if(!sec||!ad.reviews?.length) return;
    const items=ad.reviews.map(r=>`
      <div class="review" data-rating="${r.rating}">
        <img class="review__avatar" src="${r.avatar||''}" alt="${r.user||''}" loading="lazy">
        <div class="review__content">
          <div class="review__user">${r.user||''}</div>
          <div>${'★'.repeat(r.rating||0)}${'☆'.repeat(5-(r.rating||0))}</div>
          <p class="review__comment">${r.comment||''}</p>
          <span class="review__date">${r.date||''}</span>
        </div>
      </div>`).join('');
    sec.innerHTML=`
      <div class="reviews-section">
        <h3>${t('التقييمات','Avis','Reviews')} (${ad.reviews.length})</h3>
        <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <button class="chip active" onclick="filterReviews('all',this)">${t('الكل','Tous','All')}</button>
          <button class="chip" onclick="filterReviews('positive',this)">${t('إيجابية','Positifs','Positive')}</button>
          <button class="chip" onclick="filterReviews('negative',this)">${t('سلبية','Négatifs','Negative')}</button>
        </div>
        <div id="reviews-list">${items}</div>
      </div>`;
  }

  window.filterReviews=function(type,el){
    document.querySelectorAll('#reviews-list .review').forEach(r=>{
      const rt=parseInt(r.dataset.rating||5);
      r.style.display=(type==='all'||(type==='positive'&&rt>=3)||(type==='negative'&&rt<3))?'flex':'none';
    });
    el.closest('.row').querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    el.classList.add('active');
  };

  /* ===== مشابهة ===== */
  async function renderSimilar(ad){
    const sec=document.getElementById('similar-section');
    if(!sec) return;
    const ads=await loadSimilar(ad);
    if(!ads.length){ sec.hidden=true; return; }
    sec.hidden=false;
    sec.innerHTML=`
      <div class="similar-section">
        <h3>${t('إعلانات مشابهة','Annonces similaires','Similar ads')}</h3>
        <div class="similar-grid">
          ${ads.map(a=>`
            <div class="card" onclick="window.openAd&&window.openAd('${a.id}')" style="cursor:pointer">
              <img class="card__img" src="${a.thumb||a.image||''}" loading="lazy" alt="${a.title||''}">
              <div class="card__body">
                <h3 class="card__title">${a.title||''}</h3>
                <div class="card__price num-ltr">${Number(a.price).toLocaleString('ar-DZ')} دج</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* ===== التذييل الثابت ===== */
  function renderFooter(ad, seller){
    const foot=document.getElementById('detail-footer');
    if(!foot) return;
    const isOwner = window.__auth_user?.id===seller.id;
    if(isOwner){
      foot.innerHTML=`
        <button class="btn btn--ghost" onclick="history.back()">‹ ${t('رجوع','Retour','Back')}</button>
        <a class="btn btn--primary grow" href="post-ad.html?edit=${ad.id}">${t('تعديل الإعلان','Modifier','Edit')}</a>`;
    } else {
      foot.innerHTML=`
        <button class="btn-back-circle" onclick="history.back()" aria-label="${t('رجوع','Retour','Back')}">‹</button>
        <button class="btn btn--ghost" id="share-btn">🔗 ${t('مشاركة','Partager','Share')}</button>
        <button class="btn btn--primary grow" onclick="openChat('${ad.id}','${seller.id}')">💬 ${t('تواصل','Contacter','Contact')}</button>`;
      initShare(ad);
    }
  }

  /* ===== تتبع المشاهدة ===== */
  function trackView(id){
    const key='snsa_recent';
    try{
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      const upd=[id,...arr.filter(x=>x!==id)].slice(0,30);
      localStorage.setItem(key,JSON.stringify(upd));
    }catch(e){}
    // إرسال للخادم (fire and forget)
    const base=window.SUPABASE_URL||''; const k=window.SUPABASE_ANON||'';
    if(base&&k){
      fetch(`${base}/rest/v1/rpc/track_view`,{
        method:'POST',
        headers:{'apikey':k,'Authorization':'Bearer '+k,'Content-Type':'application/json'},
        body:JSON.stringify({_ad_id:id})
      }).catch(()=>{});
    }
  }

  function showError(){
    const body=document.getElementById('detail-body');
    if(body) body.innerHTML=`<div class="empty"><p>${t('الإعلان غير موجود','Annonce introuvable','Ad not found')}</p><a class="btn btn--primary" href="index.html">${t('العودة','Retour','Back')}</a></div>`;
  }

  if(document.readyState!=='loading') render();
  else document.addEventListener('DOMContentLoaded',render);
})();
