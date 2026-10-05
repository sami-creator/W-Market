/* settings.js — صفحة الإعدادات */
'use strict';
(function(){

  const lang = document.documentElement.lang||'ar';
  const t=(ar,fr,en)=>({ar,fr,en}[lang]||ar);

  function init(){
    if(!document.getElementById('settings-root')) return;

    /* theme.js يتولى شبكة الألوان والخطوط */
    /* هنا نتولى باقي الإعدادات */

    bindLangSelector();
    bindPhoneSave();
    loadPhone();
    bindAccountLinks();
  }

  /* ===== اللغة ===== */
  function bindLangSelector(){
    const sel=document.getElementById('lang-select');
    if(!sel) return;
    sel.value=document.documentElement.lang||'ar';
    sel.addEventListener('change',()=>{
      localStorage.setItem('snsa_lang',sel.value);
      document.documentElement.lang=sel.value;
      window.UI?.toast(t('ستُطبّق عند إعادة التحميل','Appliqué au rechargement','Applied on reload'));
    });
  }

  /* ===== حفظ الهاتف ===== */
  function loadPhone(){
    const inp=document.getElementById('settings-phone');
    if(inp) inp.value=localStorage.getItem('snsa_phone')||'';
  }

  function bindPhoneSave(){
    const btn=document.getElementById('save-phone-btn');
    const inp=document.getElementById('settings-phone');
    if(!btn||!inp) return;
    btn.addEventListener('click',async()=>{
      const val=inp.value.trim();
      // التحقق البسيط
      if(val&&!/^0[5-7]\d{8}$/.test(val)){
        window.UI?.toast(t('رقم غير صحيح','Numéro invalide','Invalid number'),'error');
        return;
      }
      localStorage.setItem('snsa_phone',val);
      // تحديث في Supabase
      const base=window.SUPABASE_URL||''; const key=window.SUPABASE_ANON||'';
      const uid=window.__auth_user?.id;
      if(base&&key&&uid){
        try{
          await fetch(`${base}/rest/v1/profiles?id=eq.${uid}`,{
            method:'PATCH',
            headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'},
            body:JSON.stringify({phone:val})
          });
        }catch(e){ console.error(e); }
      }
      window.UI?.toast(t('تم الحفظ','Sauvegardé','Saved'),'success');
    });
  }

  /* ===== روابط الحساب ===== */
  function bindAccountLinks(){
    document.getElementById('btn-delete-account')?.addEventListener('click',()=>{
      if(!confirm(t('هل أنت متأكدة؟','Êtes-vous sûre?','Are you sure?'))) return;
      window.UI?.toast(t('تواصلي مع الدعم','Contactez le support','Contact support'));
    });
  }

  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded',init);
})();
