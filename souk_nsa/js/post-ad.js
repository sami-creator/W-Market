/* post-ad.js — نشر/تعديل إعلان: خطوات مرقّمة، ألوان متعددة، مقاسات، حالة، نوع الإعلان */
'use strict';
(function(){

  const lang = document.documentElement.lang||'ar';
  const t = (ar,fr,en)=>({ar,fr,en}[lang]||ar);

  let currentStep = 1;
  const TOTAL_STEPS = 4;
  let editId = null;
  let uploadedImgs = []; // [{url, file}]
  let selectedColors = [];
  let selectedSizes  = [];

  /* ===== بيانات النموذج ===== */
  const form = {
    title:'', desc:'', cat:'', sub:'',
    price:'', old_price:'', negotiable:false,
    listing_type:'sale',        // sale | rent | both
    rent_price:'',
    delivery:false,             // افتراضياً false
    condition:'new',            // new | used
    condition_score:10,
    wilaya_n:'', municipality:'', map_url:'', location_label:'',
    phone:'', phone2:'', phone3:'',
    colors:[], sizes:[],
    images:[],
  };

  /* ===== تهيئة ===== */
  function init(){
    if(!document.getElementById('post-ad-form')) return;

    // تحقق هل نعدّل إعلاناً؟
    const p=new URLSearchParams(location.search);
    editId=p.get('edit')||null;
    if(editId) loadEditData(editId);

    // رقم الهاتف من الإعدادات
    const savedPhone=localStorage.getItem('snsa_phone')||'';
    if(savedPhone){ form.phone=savedPhone; const el=document.getElementById('f-phone'); if(el) el.value=savedPhone; }

    // بناء الواجهة
    buildCatOptions();
    buildColorSwatches();
    buildSizeOptions();
    buildListingTypeBtns();
    buildWilayaSelect();
    updateStep();
    bindEvents();
  }

  /* ===== تحميل بيانات التعديل ===== */
  async function loadEditData(id){
    const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
    if(!base||!key) return;
    try{
      const r=await fetch(`${base}/rest/v1/ads?id=eq.${id}&select=*`,{headers:{'apikey':key,'Authorization':'Bearer '+key}});
      const d=await r.json();
      if(!d[0]) return;
      const ad=d[0];
      Object.assign(form,ad);
      uploadedImgs=(ad.images||[]).map(url=>({url}));
      selectedColors=ad.colors||[];
      selectedSizes=ad.sizes||[];
      fillFormFields();
      renderImgGrid();
    }catch(e){ console.error(e); }
  }

  function fillFormFields(){
    [['f-title','title'],['f-desc','desc'],['f-price','price'],
     ['f-old-price','old_price'],['f-rent-price','rent_price'],
     ['f-phone','phone'],['f-phone2','phone2'],['f-phone3','phone3'],
     ['f-map-url','map_url'],['f-location-label','location_label'],
    ].forEach(([id,key])=>{
      const el=document.getElementById(id);
      if(el&&form[key]!=null) el.value=form[key];
    });
    // negotiable
    const negEl=document.getElementById('f-negotiable');
    if(negEl) negEl.checked=form.negotiable;
    // delivery
    const delEl=document.getElementById('f-delivery');
    if(delEl) delEl.checked=form.delivery;
    // condition
    selectCondition(form.condition, form.condition_score);
    // listing type
    document.querySelectorAll('[data-listing-type]').forEach(b=>b.classList.toggle('active',b.dataset.listingType===form.listing_type));
    toggleRentField(form.listing_type);
    // ألوان ومقاسات
    updateColorSwatches();
    updateSizeOptions();
  }

  /* ===== بناء أصناف ===== */
  function buildCatOptions(){
    const sel=document.getElementById('f-cat');
    if(!sel||!window.CATEGORIES) return;
    window.CATEGORIES.all().forEach(c=>{
      const opt=document.createElement('option');
      opt.value=c.id; opt.textContent=c.label;
      sel.appendChild(opt);
    });
    sel.addEventListener('change',()=>{
      form.cat=sel.value;
      buildSubOptions(sel.value);
      toggleShoeSizes(sel.value);
      validateStep();
    });
  }

  function buildSubOptions(cat){
    const sel=document.getElementById('f-sub');
    if(!sel) return;
    sel.innerHTML=`<option value="">${t('اختر الصنف الفرعي','Sous-catégorie','Sub-category')}</option>`;
    (window.CATEGORIES?.byCat(cat)||[]).forEach(s=>{
      const opt=document.createElement('option');
      opt.value=s.id; opt.textContent=s.label;
      sel.appendChild(opt);
    });
  }

  function toggleShoeSizes(cat){
    const wrap=document.getElementById('size-wrap');
    if(!wrap) return;
    const isShoe=cat==='shoes';
    buildSizeOptions(isShoe);
  }

  /* ===== ألوان الملابس ===== */
  function buildColorSwatches(){
    const wrap=document.getElementById('color-pick');
    if(!wrap) return;
    wrap.innerHTML='';
    (window.APP?.ITEM_COLORS||[]).forEach(c=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='color-swatch'+(selectedColors.includes(c.id)?' sel':'');
      btn.style.background=c.hex;
      if(c.border) btn.style.border='2px solid #ccc';
      btn.title=c.label;
      btn.setAttribute('aria-label',c.label);
      btn.addEventListener('click',()=>{
        if(selectedColors.includes(c.id)){
          selectedColors=selectedColors.filter(x=>x!==c.id);
          btn.classList.remove('sel');
        } else {
          selectedColors.push(c.id);
          btn.classList.add('sel');
        }
        form.colors=selectedColors;
      });
      wrap.appendChild(btn);
    });
  }

  function updateColorSwatches(){
    document.querySelectorAll('#color-pick .color-swatch').forEach((btn,i)=>{
      const c=(window.APP?.ITEM_COLORS||[])[i];
      if(c) btn.classList.toggle('sel',selectedColors.includes(c.id));
    });
  }

  /* ===== مقاسات ===== */
  function buildSizeOptions(shoes=false){
    const wrap=document.getElementById('size-pick');
    if(!wrap) return;
    wrap.innerHTML='';
    const sizes=shoes?(window.APP?.SHOE_SIZES||[]):(window.APP?.CLOTHING_SIZES||[]);
    sizes.forEach(s=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='size-tag'+(selectedSizes.includes(s)?' sel':'');
      btn.textContent=s;
      btn.addEventListener('click',()=>{
        if(selectedSizes.includes(s)){
          selectedSizes=selectedSizes.filter(x=>x!==s);
          btn.classList.remove('sel');
        } else {
          selectedSizes.push(s);
          btn.classList.add('sel');
        }
        form.sizes=selectedSizes;
      });
      wrap.appendChild(btn);
    });
  }

  function updateSizeOptions(){
    document.querySelectorAll('#size-pick .size-tag').forEach(btn=>{
      btn.classList.toggle('sel',selectedSizes.includes(btn.textContent.trim()));
    });
  }

  /* ===== نوع الإعلان ===== */
  function buildListingTypeBtns(){
    document.querySelectorAll('[data-listing-type]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        form.listing_type=btn.dataset.listingType;
        document.querySelectorAll('[data-listing-type]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        toggleRentField(form.listing_type);
      });
    });
    // افتراضي: بيع
    const defBtn=document.querySelector('[data-listing-type="sale"]');
    if(defBtn) defBtn.classList.add('active');
  }

  function toggleRentField(type){
    const wrap=document.getElementById('rent-price-wrap');
    if(wrap) wrap.hidden=(type==='sale');
  }

  /* ===== حالة المنتج ===== */
  function selectCondition(cond, score=10){
    document.querySelectorAll('[data-condition]').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.condition===cond);
    });
    const scoreWrap=document.getElementById('condition-score-wrap');
    if(scoreWrap) scoreWrap.hidden=(cond!=='used');
    if(cond==='used'){
      const sc=document.getElementById('f-condition-score');
      if(sc) sc.value=score;
    }
    form.condition=cond;
    form.condition_score=score;
  }

  /* ===== ولايات ===== */
  function buildWilayaSelect(){
    const sel=document.getElementById('f-wilaya');
    if(!sel) return;
    sel.innerHTML=`<option value="">${t('اختر الولاية','Choisir wilaya','Choose wilaya')}</option>`;
    (window.APP?.WILAYAS||[]).forEach(w=>{
      const opt=document.createElement('option');
      opt.value=w.n;
      opt.textContent=`${w.n}. ${w.ar}`;
      if(form.wilaya_n==w.n) opt.selected=true;
      sel.appendChild(opt);
    });
  }

  /* ===== رفع الصور ===== */
  function renderImgGrid(){
    const wrap=document.getElementById('img-upload-grid');
    if(!wrap) return;
    wrap.innerHTML='';
    uploadedImgs.forEach((img,i)=>{
      const slot=document.createElement('div');
      slot.className='img-slot';
      slot.innerHTML=`<img src="${img.url}" alt=""><button type="button" class="del-img" aria-label="حذف">×</button>`;
      slot.querySelector('.del-img').addEventListener('click',()=>{ uploadedImgs.splice(i,1); renderImgGrid(); });
      wrap.appendChild(slot);
    });
    if(uploadedImgs.length<8){
      const add=document.createElement('div');
      add.className='img-slot img-slot--add';
      add.innerHTML='＋';
      add.addEventListener('click',()=>document.getElementById('f-img-input')?.click());
      wrap.appendChild(add);
    }
  }

  /* ===== خطوات ===== */
  function updateStep(){
    document.querySelectorAll('[data-step]').forEach(el=>{
      el.hidden=(parseInt(el.dataset.step)!==currentStep);
    });
    // شريط التقدم
    const bars=document.querySelectorAll('.stepper span');
    bars.forEach((b,i)=>{
      b.classList.toggle('on',i<currentStep);
      b.classList.toggle('current',i===currentStep-1);
    });
    const lbl=document.getElementById('step-label');
    if(lbl) lbl.textContent=`${t('الخطوة','Étape','Step')} ${currentStep} ${t('من','de','of')} ${TOTAL_STEPS}`;
    updateNextBtn();
    // إخفاء زر السابق في الخطوة 1
    const prevBtn=document.getElementById('step-prev');
    if(prevBtn) prevBtn.hidden=(currentStep===1);
  }

  function updateNextBtn(){
    const btn=document.getElementById('step-next');
    if(!btn) return;
    const valid=validateStep(true);
    btn.className='btn btn--block '+(valid?'btn-next--ready':'btn-next--not-ready');
    btn.textContent=currentStep===TOTAL_STEPS
      ? t('نشر الإعلان','Publier','Post')
      : t('التالي','Suivant','Next');
  }

  /* ===== التحقق من الخطوة ===== */
  function validateStep(silent=false){
    if(currentStep===1){
      const title=document.getElementById('f-title')?.value.trim();
      const cat=document.getElementById('f-cat')?.value;
      const price=document.getElementById('f-price')?.value;
      return !!(title&&cat&&price&&Number(price)>0);
    }
    if(currentStep===2) return uploadedImgs.length>0; // صورة واحدة على الأقل (اختيارية → دائماً true)
    return true; // بقية الخطوات اختيارية
  }

  /* ===== ربط الأحداث ===== */
  function bindEvents(){
    // التالي
    document.getElementById('step-next')?.addEventListener('click',()=>{
      if(currentStep===TOTAL_STEPS){ submitAd(); return; }
      collectStep();
      currentStep++;
      updateStep();
      window.scrollTo({top:0,behavior:'smooth'});
    });
    // السابق
    document.getElementById('step-prev')?.addEventListener('click',()=>{
      currentStep--;
      updateStep();
      window.scrollTo({top:0,behavior:'smooth'});
    });
    // حالة المنتج
    document.querySelectorAll('[data-condition]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const score=parseInt(document.getElementById('f-condition-score')?.value||10);
        selectCondition(btn.dataset.condition, score);
      });
    });
    document.getElementById('f-condition-score')?.addEventListener('input',e=>{
      form.condition_score=parseInt(e.target.value||10);
    });
    // توصيل — افتراضياً غير محدد
    document.getElementById('f-delivery')?.addEventListener('change',e=>{ form.delivery=e.target.checked; });
    // تفاوض
    document.getElementById('f-negotiable')?.addEventListener('change',e=>{ form.negotiable=e.target.checked; });
    // رفع الصور
    const imgInput=document.getElementById('f-img-input');
    if(imgInput){
      imgInput.addEventListener('change',async()=>{
        const files=[...imgInput.files];
        for(const f of files){
          if(uploadedImgs.length>=8) break;
          const url=await uploadImage(f);
          if(url) uploadedImgs.push({url,file:f});
        }
        imgInput.value='';
        renderImgGrid();
        validateStep();
        updateNextBtn();
      });
    }
    // تحقق لحظي عند الكتابة
    ['f-title','f-cat','f-price'].forEach(id=>{
      document.getElementById(id)?.addEventListener('input',()=>updateNextBtn());
    });
    // أرقام الهاتف
    document.getElementById('f-phone')?.addEventListener('input',e=>{ form.phone=e.target.value.trim(); });
    document.getElementById('f-phone2')?.addEventListener('input',e=>{ form.phone2=e.target.value.trim(); });
    document.getElementById('f-phone3')?.addEventListener('input',e=>{ form.phone3=e.target.value.trim(); });
    // خريطة
    document.getElementById('f-map-url')?.addEventListener('input',e=>{ form.map_url=e.target.value.trim(); });

    // render grid الصور عند التهيئة
    renderImgGrid();
  }

  /* ===== جمع بيانات الخطوة الحالية ===== */
  function collectStep(){
    if(currentStep===1){
      form.title=document.getElementById('f-title')?.value.trim();
      form.desc=document.getElementById('f-desc')?.value.trim();
      form.cat=document.getElementById('f-cat')?.value;
      form.sub=document.getElementById('f-sub')?.value;
      form.price=document.getElementById('f-price')?.value;
      form.old_price=document.getElementById('f-old-price')?.value;
      form.rent_price=document.getElementById('f-rent-price')?.value;
    }
    if(currentStep===2){
      form.images=uploadedImgs.map(x=>x.url);
      form.colors=selectedColors;
      form.sizes=selectedSizes;
    }
    if(currentStep===3){
      form.wilaya_n=document.getElementById('f-wilaya')?.value;
      form.municipality=document.getElementById('f-municipality')?.value;
      form.map_url=document.getElementById('f-map-url')?.value.trim();
      form.location_label=document.getElementById('f-location-label')?.value.trim();
      form.phone=document.getElementById('f-phone')?.value.trim();
      form.phone2=document.getElementById('f-phone2')?.value.trim();
      form.phone3=document.getElementById('f-phone3')?.value.trim();
    }
  }

  /* ===== رفع صورة (ImageKit عبر Edge Function) ===== */
  async function uploadImage(file){
    try{
      const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
      const fd=new FormData(); fd.append('file',file);
      const r=await fetch(`${base}/functions/v1/upload-image`,{
        method:'POST',
        headers:{'apikey':key,'Authorization':'Bearer '+key},
        body:fd
      });
      const d=await r.json();
      return d.url||null;
    }catch(e){ console.error(e); return null; }
  }

  /* ===== إرسال النموذج ===== */
  async function submitAd(){
    collectStep();
    const btn=document.getElementById('step-next');
    if(btn){ btn.classList.add('is-loading'); btn.disabled=true; }
    try{
      const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
      const user=window.__auth_user;
      if(!user){ window.UI?.toast(t('سجّلي أولاً','Connectez-vous','Sign in first')); return; }

      // الإعداد النهائي
      const payload={
        ...form,
        seller_id:user.id,
        status:'active',
        delivery: form.delivery||false,
        condition: form.condition||'new',
        condition_score: form.condition==='used'?(form.condition_score||10):null,
        listing_type: form.listing_type||'sale',
        rent_price: (form.listing_type!=='sale'&&form.rent_price)?form.rent_price:null,
        negotiable: form.negotiable||false,
        images: uploadedImgs.map(x=>x.url),
        colors: selectedColors,
        sizes:  selectedSizes,
      };

      // إرسال عبر edge function لضمان الأمان
      const r=await fetch(`${base}/functions/v1/submit-ad`,{
        method:'POST',
        headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'},
        body:JSON.stringify({...(editId?{id:editId}:{}), ...payload})
      });
      if(!r.ok){ const e=await r.json(); throw new Error(e.error||'فشل النشر'); }
      const d=await r.json();
      window.UI?.toast(t('تم النشر بنجاح 🎉','Publié avec succès 🎉','Posted! 🎉'),'success');
      setTimeout(()=>{ location.href=`ad-details.html?id=${d.id||editId}`; },1200);
    }catch(err){
      window.UI?.toast(err.message||t('خطأ','Erreur','Error'),'error');
      if(btn){ btn.classList.remove('is-loading'); btn.disabled=false; }
    }
  }

  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded',init);
})();
