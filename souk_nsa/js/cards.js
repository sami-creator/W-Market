/* cards.js — رسم بطاقات الإعلانات بتصميم prototype */
'use strict';
(function(){

  /* تنسيق السعر */
  function fmt(n){ return Number(n).toLocaleString('ar-DZ'); }

  /* نجوم */
  function stars(r){
    r = Math.round(r||0);
    return '<span class="stars">'+('★'.repeat(r)+'☆'.repeat(5-r))+'</span>';
  }

  /* اسم الولاية */
  function wilayaName(n){
    const w=(window.APP?.WILAYAS||[]).find(x=>x.n==n);
    return w?`${w.n}. ${w.ar}`:'';
  }

  /* ===== HTML بطاقة واحدة ===== */
  function cardHTML(ad, opts={}){
    const liked  = opts.likedIds?.has(String(ad.id));
    const lang   = document.documentElement.lang||'ar';

    /* السعر */
    let priceHTML = '';
    if(ad.old_price){
      priceHTML += `<del class="card__old num-ltr">${fmt(ad.old_price)} دج</del> `;
    }
    priceHTML += `<span class="num-ltr">${fmt(ad.price)} دج</span>`;
    if(ad.discount){ priceHTML += ` <span style="color:var(--ok);font-size:11px">-${Math.abs(ad.discount)}%</span>`; }

    /* prix fixe */
    const fixedLabel = { ar:'سعر ثابت', fr:'Prix fixe', en:'Fixed price' }[lang]||'سعر ثابت';
    const fixedHTML = (!ad.negotiable && ad.price)
      ? `<span class="card__prix-fixe">${fixedLabel}</span>` : '';

    /* الموقع */
    const wName = wilayaName(ad.wilaya_n);
    const km    = ad.distance_km ? `<span class="num-ltr">${parseFloat(ad.distance_km).toFixed(1)}</span> كم` : '';
    const locHTML = (wName||km)
      ? `<div class="card__location">${[wName,km].filter(Boolean).join(' · ')}</div>`
      : '';

    /* شارات */
    const badges = [];
    if(ad.sold)      badges.push(`<span class="badge badge--sale">${{ar:'تم البيع',fr:'Vendu',en:'Sold'}[lang]}</span>`);
    if(ad.is_used)   badges.push(`<span class="badge badge--used">${{ar:`مستعمل ${ad.condition_score}/10`,fr:`Usagé ${ad.condition_score}/10`,en:`Used ${ad.condition_score}/10`}[lang]}</span>`);
    if(ad.listing_type==='rent') badges.push(`<span class="badge badge--rent">${{ar:'كراء',fr:'Location',en:'Rent'}[lang]}</span>`);
    if(ad.listing_type==='both') badges.push(`<span class="badge badge--rent">${{ar:'بيع/كراء',fr:'Vente/Loc',en:'Sale/Rent'}[lang]}</span>`);

    const sold_ribbon = ad.sold
      ? `<div class="sold-ribbon">${{ar:'تم البيع',fr:'Vendu',en:'Sold'}[lang]}</div>` : '';

    /* البائعة */
    const verTick = ad.seller_verified ? ' <span class="verified-tick">✓</span>':'' ;
    const presence = ad.seller_online
      ? '<span class="presence on"></span>'
      : '<span class="presence"></span>';

    return `
<article class="card" data-id="${ad.id}" role="button" tabindex="0"
  aria-label="${ad.title}"
  onclick="window.openAd&&window.openAd(${ad.id})"
  onkeydown="if(event.key==='Enter')window.openAd&&window.openAd(${ad.id})">

  <div class="card__badges">${badges.join('')}</div>

  <div style="position:relative">
    <img class="card__img" src="${ad.thumb||ad.image||''}"
      loading="lazy" decoding="async"
      alt="${ad.title||''}"
      onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 5%22%3E%3Crect fill=%22%23eee%22 width=%224%22 height=%225%22/%3E%3C/svg%3E'">
    ${sold_ribbon}
    <button class="like-btn${liked?' liked':''}"
      aria-label="إعجاب" aria-pressed="${liked||false}"
      onclick="event.stopPropagation();window.LIKES&&window.LIKES.toggle(this,${ad.id})"
      ${!window.__auth_user?'disabled':''}
    >${liked?'❤️':'🤍'}</button>
  </div>

  <div class="card__body">
    <h3 class="card__title">${ad.title||''}</h3>
    <div class="card__user">
      <img class="avatar-xs"
        src="${ad.seller_avatar||'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22%3E%3Crect fill=%22%23ccc%22 width=%221%22 height=%221%22/%3E%3C/svg%3E'}"
        alt="${ad.seller_name||''}" loading="lazy">
      ${presence}${ad.seller_name||''}${verTick}
    </div>
    ${locHTML}
    <div class="card__price">${priceHTML}</div>
    ${fixedHTML}
    <div class="card__meta">
      <span>${stars(ad.rating)} <small>(${ad.review_count||0})</small></span>
      <span>❤️ <small class="num-ltr">${ad.likes||0}</small></span>
    </div>
  </div>
</article>`;
  }

  /* ===== رسم شبكة الإعلانات ===== */
  function renderGrid(ads, container, opts={}){
    if(!container) return;
    if(!ads||ads.length===0){
      container.innerHTML=`<div class="empty grid"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg><p>لا توجد إعلانات</p></div>`;
      return;
    }
    container.innerHTML = ads.map(ad=>cardHTML(ad,opts)).join('');
  }

  /* ===== skeleton قبل التحميل ===== */
  function renderSkeleton(container, count=6){
    if(!container) return;
    container.innerHTML = Array(count).fill(0).map(()=>`
      <div class="card">
        <div class="sk sk-img"></div>
        <div class="card__body">
          <div class="sk sk-line"></div>
          <div class="sk sk-line sk-short"></div>
          <div class="sk sk-line" style="width:40%;height:10px;margin-top:6px"></div>
        </div>
      </div>`).join('');
  }

  window.CARDS = { cardHTML, renderGrid, renderSkeleton };
})();
