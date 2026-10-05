/* filters.js — فلاتر متقدمة: حفظ في URL+localStorage، ولايات متعددة مرقّمة، تغيير لون الزر */
'use strict';
(function(){

  /* ===== مخزن الفلاتر ===== */
  const STORE_KEY = 'snsa_filters';
  let _state = loadState();

  function loadState(){
    try{
      const url = new URLSearchParams(location.search);
      const s = {};
      for(const [k,v] of url) s[k] = v.includes(',') ? v.split(',') : v;
      if(Object.keys(s).length) return s;
    }catch(e){}
    try{ return JSON.parse(sessionStorage.getItem(STORE_KEY)||'{}'); }catch(e){ return {}; }
  }

  function saveState(){
    sessionStorage.setItem(STORE_KEY, JSON.stringify(_state));
    const params = new URLSearchParams();
    Object.entries(_state).forEach(([k,v])=>{
      if(v && (Array.isArray(v)?v.length:true)){
        params.set(k, Array.isArray(v)?v.join(','):v);
      }
    });
    const qs = params.toString();
    history.replaceState(null,'', location.pathname + (qs?'?'+qs:''));
    updateFilterBtn();
    emitChange();
  }

  function set(key,val){ _state[key]=val; saveState(); }
  function get(key){ return _state[key]; }
  function clear(){ _state={}; saveState(); }
  function remove(key){ delete _state[key]; saveState(); }

  /* ===== زر الفلاتر يتغير لونه عند وجود فلتر مفعّل ===== */
  function updateFilterBtn(){
    const hasActive = Object.values(_state).some(v=>v&&(Array.isArray(v)?v.length:v!==''));
    document.querySelectorAll('.filter-btn').forEach(b=>{
      b.classList.toggle('has-active', hasActive);
    });
    renderActiveTags();
  }

  /* ===== شارات الفلاتر النشطة ===== */
  function renderActiveTags(){
    const wrap = document.getElementById('active-filters');
    if(!wrap) return;
    wrap.innerHTML='';
    Object.entries(_state).forEach(([k,v])=>{
      const vals = Array.isArray(v)?v:[v];
      vals.forEach(val=>{
        if(!val) return;
        const tag = document.createElement('span');
        tag.className='tag';
        tag.innerHTML=`${labelFor(k,val)} <button aria-label="إزالة">×</button>`;
        tag.querySelector('button').addEventListener('click',()=>{
          if(Array.isArray(_state[k])){
            _state[k]=_state[k].filter(x=>x!==val);
            if(!_state[k].length) delete _state[k];
          } else { delete _state[k]; }
          saveState();
        });
        wrap.appendChild(tag);
      });
    });
  }

  function labelFor(k,v){
    const MAP={
      sort:{latest:'الأحدث',views:'الأكثر مشاهدة',rating:'التقييم',price_asc:'سعر↑',price_desc:'سعر↓',nearest:'الأقرب'},
      delivery:{true:'توصيل متوفر'},
      verified:{true:'موثّقة فقط'},
      condition:{new:'جديد',used:'مستعمل'},
      listing_type:{sale:'بيع',rent:'كراء',both:'بيع أو كراء'},
    };
    if(k==='wilaya'){
      const w = (window.APP?.WILAYAS||[]).find(x=>x.n==v);
      return w?`${w.n}. ${w.ar}`:v;
    }
    if(k==='color'){
      const c=(window.APP?.ITEM_COLORS||[]).find(x=>x.id===v);
      return c?c.label:v;
    }
    if(k==='size') return v;
    if(k==='min_price') return `≥ ${Number(v).toLocaleString()} دج`;
    if(k==='max_price') return `≤ ${Number(v).toLocaleString()} دج`;
    return MAP[k]?.[v] || v;
  }

  /* ===== تهيئة لوحة الفلاتر ===== */
  function initPanel(){
    const panel = document.getElementById('filters-panel');
    if(!panel) return;

    /* شبكة الولايات المرقّمة */
    const wilayaGrid = panel.querySelector('#wilaya-grid');
    if(wilayaGrid){
      wilayaGrid.innerHTML='';
      (window.APP?.WILAYAS||[]).forEach(w=>{
        const id=`w_${w.n}`;
        const cur = (get('wilaya')||[]);
        const checked = Array.isArray(cur)?cur.includes(String(w.n)):cur===String(w.n);
        wilayaGrid.innerHTML += `
          <label>
            <input type="checkbox" name="wilaya" value="${w.n}" ${checked?'checked':''}>
            <span class="num-ltr">${w.n}.</span> ${w.ar}
          </label>`;
      });
    }

    /* ترتيب */
    const sortSel = panel.querySelector('#filter-sort');
    if(sortSel) sortSel.value = get('sort')||'latest';

    /* توصيل */
    const deliveryCk = panel.querySelector('#filter-delivery');
    if(deliveryCk) deliveryCk.checked = get('delivery')==='true';

    /* موثّقة */
    const verifiedCk = panel.querySelector('#filter-verified');
    if(verifiedCk) verifiedCk.checked = get('verified')==='true';

    /* سعر */
    const minP = panel.querySelector('#filter-min-price');
    const maxP = panel.querySelector('#filter-max-price');
    if(minP) minP.value = get('min_price')||'';
    if(maxP) maxP.value = get('max_price')||'';

    /* حالة */
    const condSel = panel.querySelector('#filter-condition');
    if(condSel) condSel.value = get('condition')||'';

    /* نوع الإعلان */
    const typeSel = panel.querySelector('#filter-listing-type');
    if(typeSel) typeSel.value = get('listing_type')||'';

    /* الألوان */
    renderColorFilter(panel);

    /* المقاسات */
    renderSizeFilter(panel);

    /* زر التطبيق */
    const applyBtn = panel.querySelector('#filter-apply');
    if(applyBtn) applyBtn.addEventListener('click', ()=>applyFromPanel(panel));

    /* زر إعادة الضبط */
    const resetBtn = panel.querySelector('#filter-reset');
    if(resetBtn) resetBtn.addEventListener('click',()=>{ clear(); closePanel(); });
  }

  function renderColorFilter(panel){
    const wrap = panel.querySelector('#filter-colors');
    if(!wrap) return;
    wrap.innerHTML='';
    const cur = get('color')||[];
    (window.APP?.ITEM_COLORS||[]).forEach(c=>{
      const sel = Array.isArray(cur)?cur.includes(c.id):cur===c.id;
      const sw = document.createElement('button');
      sw.className='color-swatch'+(sel?' sel':'');
      sw.style.background = c.hex;
      sw.title=c.label;
      if(c.border) sw.style.border='2px solid #ccc';
      sw.addEventListener('click',()=>sw.classList.toggle('sel'));
      wrap.appendChild(sw);
    });
  }

  function renderSizeFilter(panel){
    const wrap = panel.querySelector('#filter-sizes');
    if(!wrap) return;
    const cat = document.querySelector('[data-cat]')?.dataset.cat||'';
    const sizes = cat==='shoes'?(window.APP?.SHOE_SIZES||[]):(window.APP?.CLOTHING_SIZES||[]);
    const cur = get('size')||[];
    wrap.innerHTML='';
    sizes.forEach(s=>{
      const sel = Array.isArray(cur)?cur.includes(s):cur===s;
      const btn=document.createElement('button');
      btn.className='size-tag'+(sel?' sel':'');
      btn.textContent=s;
      btn.addEventListener('click',()=>btn.classList.toggle('sel'));
      wrap.appendChild(btn);
    });
  }

  function applyFromPanel(panel){
    /* ولايات */
    const checked = [...panel.querySelectorAll('input[name="wilaya"]:checked')].map(x=>x.value);
    if(checked.length) set('wilaya',checked); else remove('wilaya');

    const sortSel=panel.querySelector('#filter-sort');
    if(sortSel) sortSel.value?set('sort',sortSel.value):remove('sort');

    const deliveryCk=panel.querySelector('#filter-delivery');
    if(deliveryCk) deliveryCk.checked?set('delivery','true'):remove('delivery');

    const verifiedCk=panel.querySelector('#filter-verified');
    if(verifiedCk) verifiedCk.checked?set('verified','true'):remove('verified');

    const minP=panel.querySelector('#filter-min-price');
    const maxP=panel.querySelector('#filter-max-price');
    if(minP) minP.value?set('min_price',minP.value):remove('min_price');
    if(maxP) maxP.value?set('max_price',maxP.value):remove('max_price');

    const condSel=panel.querySelector('#filter-condition');
    if(condSel) condSel.value?set('condition',condSel.value):remove('condition');

    const typeSel=panel.querySelector('#filter-listing-type');
    if(typeSel) typeSel.value?set('listing_type',typeSel.value):remove('listing_type');

    /* ألوان محددة */
    const selColors=[...panel.querySelectorAll('.color-swatch.sel')]
      .map((b,i)=>(window.APP?.ITEM_COLORS||[])[i]?.id).filter(Boolean);
    if(selColors.length) set('color',selColors); else remove('color');

    /* مقاسات محددة */
    const selSizes=[...panel.querySelectorAll('.size-tag.sel')].map(b=>b.textContent.trim());
    if(selSizes.length) set('size',selSizes); else remove('size');

    closePanel();
  }

  /* ===== فتح/إغلاق اللوحة ===== */
  function openPanel(){
    const p=document.getElementById('filters-panel');
    if(p){ initPanel(); p.removeAttribute('hidden'); p.setAttribute('aria-modal','true'); }
  }
  function closePanel(){
    const p=document.getElementById('filters-panel');
    if(p){ p.setAttribute('hidden',''); }
  }

  /* ===== إرسال حدث التغيير ===== */
  function emitChange(){
    document.dispatchEvent(new CustomEvent('filters:change',{detail:{..._state}}));
  }

  /* ===== ربط الأحداث ===== */
  function init(){
    document.querySelectorAll('.filter-btn').forEach(b=>{
      b.addEventListener('click',()=>openPanel());
    });
    document.querySelectorAll('[data-close-filters]').forEach(b=>{
      b.addEventListener('click',()=>closePanel());
    });
    /* إغلاق عند الضغط خارج اللوحة */
    document.addEventListener('click',e=>{
      const p=document.getElementById('filters-panel');
      if(!p||p.hidden) return;
      const sheet=p.querySelector('.filters-panel__sheet');
      if(sheet&&!sheet.contains(e.target)&&!e.target.closest('.filter-btn')) closePanel();
    },{passive:true});
    updateFilterBtn();
  }

  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded',init);

  /* ===== API عامة ===== */
  window.FILTERS = { get, set, remove, clear, getAll:()=>({..._state}), openPanel, closePanel };
})();
