/* app.js — الصفحة الرئيسية: شبكة الإعلانات، التبويبات، البحث، البانر */
'use strict';
(function(){

  /* ===== الحالة الثابتة عبر التنقل ===== */
  const NAV_KEY = 'snsa_nav_state';
  let _navState = {};
  try{ _navState = JSON.parse(sessionStorage.getItem(NAV_KEY)||'{}'); }catch(e){}

  function saveNavState(patch){
    _navState = {..._navState, ...patch};
    sessionStorage.setItem(NAV_KEY, JSON.stringify(_navState));
  }

  /* ===== مراجع DOM ===== */
  let grid, loadMoreBtn, searchInput, catChips, subChips, subRow, topbar, banner;

  /* ===== حالة الصفحة ===== */
  let page = 1;
  let loading = false;
  let noMore  = false;
  let currentCat = '';
  let currentSub = '';

  /* ===== تهيئة ===== */
  function init(){
    grid        = document.getElementById('ads-grid');
    loadMoreBtn = document.getElementById('load-more');
    searchInput = document.getElementById('search-input');
    catChips    = document.getElementById('cat-chips');
    subRow      = document.getElementById('sub-chips-row');
    topbar      = document.querySelector('.topbar');
    banner      = document.getElementById('site-banner');

    if(!grid) return; // ليست صفحة الرئيسية

    /* ===== البانر يدفع الصفحة ===== */
    adjustBannerOffset();

    /* ===== استعادة حالة التنقل ===== */
    if(_navState.search && searchInput){
      searchInput.value = _navState.search;
    }
    currentCat = _navState.cat||'';
    currentSub = _navState.sub||'';

    /* ===== الأصناف الفرعية ===== */
    buildCatChips();
    restoreCatChips();

    /* ===== زر scroll-to-top ===== */
    initScrollTop();

    /* ===== ربط البحث ===== */
    if(searchInput){
      let debounce;
      searchInput.addEventListener('input',()=>{
        clearTimeout(debounce);
        debounce = setTimeout(()=>{
          saveNavState({search:searchInput.value.trim()});
          resetFeed();
          loadFeed();
        }, 350);
      });
    }

    /* ===== زر تحميل المزيد ===== */
    if(loadMoreBtn){
      loadMoreBtn.addEventListener('click',()=>{ page++; loadFeed(); });
    }

    /* ===== مراقب الكيبورد ===== */
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && searchInput) searchInput.blur();
    });

    /* ===== استماع لتغيير الفلاتر ===== */
    document.addEventListener('filters:change',()=>{ resetFeed(); loadFeed(); });

    /* ===== التحميل الأول ===== */
    resetFeed();
    loadFeed();
  }

  /* ===== البانر يدفع كل شيء ===== */
  function adjustBannerOffset(){
    if(!banner||banner.hidden) return;
    const h = banner.offsetHeight;
    if(topbar) topbar.style.top = h+'px';
    document.body.style.setProperty('--banner-h', h+'px');
  }

  /* ===== بناء شرائح الأصناف ===== */
  function buildCatChips(){
    if(!catChips) return;
    catChips.querySelectorAll('[data-cat]').forEach(chip=>{
      chip.addEventListener('click',()=> onCatClick(chip));
    });
  }

  function onCatClick(chip){
    const cat = chip.dataset.cat||'';
    if(cat===currentCat){
      // نفس الصنف → إعادة ضبط
      currentCat=''; currentSub='';
      catChips.querySelectorAll('[data-cat]').forEach(c=>c.classList.remove('active'));
      hideSubRow();
    } else {
      currentCat = cat; currentSub='';
      catChips.querySelectorAll('[data-cat]').forEach(c=>c.classList.toggle('active',c.dataset.cat===cat));
      buildSubChips(cat);
    }
    saveNavState({cat:currentCat, sub:currentSub});
    resetFeed(); loadFeed();
  }

  function buildSubChips(cat){
    if(!subRow) return;
    const CATS = window.CATEGORIES?.byCat?.(cat)||[];
    if(!CATS.length){ hideSubRow(); return; }

    if(!subChips){
      subChips = document.createElement('div');
      subChips.id='sub-chips';
      subChips.className='chips chips--sub';
      subRow.innerHTML=''; subRow.appendChild(subChips);
    } else {
      subChips.innerHTML='';
    }
    CATS.forEach(s=>{
      const btn=document.createElement('button');
      btn.className='chip'+(s.id===currentSub?' active':'');
      btn.dataset.sub=s.id;
      btn.textContent=s.label;
      btn.addEventListener('click',()=>{
        currentSub = currentSub===s.id?'':s.id;
        subChips.querySelectorAll('[data-sub]').forEach(c=>c.classList.toggle('active',c.dataset.sub===currentSub));
        saveNavState({sub:currentSub});
        resetFeed(); loadFeed();
      });
      subChips.appendChild(btn);
    });
    subRow.removeAttribute('hidden');
  }

  function hideSubRow(){ if(subRow) subRow.setAttribute('hidden',''); if(subChips) subChips.innerHTML=''; }

  /* ===== استعادة حالة الشرائح ===== */
  function restoreCatChips(){
    if(currentCat && catChips){
      const chip = catChips.querySelector(`[data-cat="${currentCat}"]`);
      if(chip){ chip.classList.add('active'); buildSubChips(currentCat); }
    }
    if(currentSub && subChips){
      const s=subChips.querySelector(`[data-sub="${currentSub}"]`);
      if(s) s.classList.add('active');
    }
  }

  /* ===== تحميل الإعلانات ===== */
  function resetFeed(){
    page=1; noMore=false;
    if(grid) CARDS.renderSkeleton(grid);
    if(loadMoreBtn) loadMoreBtn.hidden=true;
  }

  async function loadFeed(){
    if(loading||noMore) return;
    loading=true;

    const filters = window.FILTERS?.getAll()||{};
    const q = searchInput?.value.trim()||'';

    const params = new URLSearchParams({
      page, per_page:12,
      ...(q           ? {q}                  : {}),
      ...(currentCat  ? {cat:currentCat}      : {}),
      ...(currentSub  ? {sub:currentSub}      : {}),
      ...filters
    });

    try{
      // استدعاء Supabase عبر الـ edge function أو REST
      const base = window.SUPABASE_URL||'';
      const key  = window.SUPABASE_ANON||'';
      let ads = [];

      if(base && key){
        // استخدام smart-search edge function إن وجد بحث، وإلا REST
        if(q){
          const r = await fetch(`${base}/functions/v1/smart-search?${params}`,{
            headers:{'apikey':key,'Authorization':'Bearer '+key}
          });
          const d = await r.json();
          ads = d.data||[];
          if(ads.length<12) noMore=true;
        } else {
          const r = await fetch(`${base}/rest/v1/ads?select=*,profiles(name,avatar,verified,online,phone)&status=eq.active&order=created_at.desc&limit=12&offset=${(page-1)*12}`,{
            headers:{'apikey':key,'Authorization':'Bearer '+key,'Prefer':'count=estimated'}
          });
          ads = await r.json();
          if(!Array.isArray(ads)||ads.length<12) noMore=true;
          // flatten seller fields
          ads = ads.map(a=>({
            ...a,
            seller_name:a.profiles?.name,
            seller_avatar:a.profiles?.avatar,
            seller_verified:a.profiles?.verified,
            seller_online:a.profiles?.online,
          }));
        }
      }

      /* رسم الشبكة */
      const likedIds = new Set(JSON.parse(localStorage.getItem('snsa_likes')||'[]').map(String));
      if(page===1){
        CARDS.renderGrid(ads, grid, {likedIds});
      } else {
        const frag = document.createDocumentFragment();
        const tmp = document.createElement('div');
        tmp.innerHTML = ads.map(ad=>CARDS.cardHTML(ad,{likedIds})).join('');
        while(tmp.firstChild) frag.appendChild(tmp.firstChild);
        grid?.appendChild(frag);
      }
      if(loadMoreBtn) loadMoreBtn.hidden = noMore;

    }catch(err){
      console.error('[app] loadFeed error', err);
      if(grid&&page===1) grid.innerHTML=`<div class="empty grid"><p>خطأ في التحميل</p></div>`;
    } finally {
      loading=false;
    }
  }

  /* ===== زر العودة لأعلى ===== */
  function initScrollTop(){
    const btn = document.getElementById('scroll-top-btn');
    if(!btn) return;
    const scroller = document.querySelector('main')||window;
    const onScroll=()=>{
      const y=scroller===window?window.scrollY:scroller.scrollTop;
      btn.classList.toggle('visible',y>300);
    };
    scroller.addEventListener('scroll',onScroll,{passive:true});
    btn.addEventListener('click',()=>{
      if(scroller===window) window.scrollTo({top:0,behavior:'smooth'});
      else scroller.scrollTo({top:0,behavior:'smooth'});
    });
  }

  /* ===== فتح إعلان (يحفظ الحالة أولاً) ===== */
  window.openAd = function(id){
    saveNavState({search:searchInput?.value.trim()||''});
    // التنقل
    if(window.ROUTER?.go) window.ROUTER.go(`/ad/${id}`);
    else location.href = `ad-details.html?id=${id}`;
  };

  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded',init);
})();
