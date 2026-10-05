/* router.js — حفظ حالة التنقل: الفلاتر + البحث + الصنف عبر الصفحات */
'use strict';
(function(){

  const NAV_KEY   = 'snsa_nav_state';
  const FILT_KEY  = 'snsa_filters';

  /* ===== تنقل مع حفظ الحالة ===== */
  function go(path){
    // حفظ الحالة الحالية قبل المغادرة
    _persist();
    if(path.startsWith('/')){
      // SPA-style (إن كان هناك router)
      location.href = path.replace(/^\//,'');
    } else {
      location.href = path;
    }
  }

  function _persist(){
    // sessionStorage يبقى عبر الصفحات في نفس النافذة
    // لا نحتاج فعل شيء إضافي — كل من filters.js و app.js يحفظان في sessionStorage
  }

  /* ===== عند تحميل أي صفحة: استعادة حالة الفلاتر ===== */
  function restoreState(){
    // الفلاتر تُستعاد تلقائياً في filters.js
    // الصنف يُستعاد في app.js
    // البحث يُستعاد في app.js
  }

  /* ===== زر الرجوع — الحفاظ على الحالة ===== */
  function back(){
    history.back();
  }

  /* ===== تنظيف عند تسجيل الخروج ===== */
  function clearAll(){
    sessionStorage.removeItem(NAV_KEY);
    sessionStorage.removeItem(FILT_KEY);
  }

  /* ===== تحديث نشاط الناف-بار ===== */
  function markActive(){
    const path=location.pathname.split('/').pop()||'index.html';
    document.querySelectorAll('.bottom-nav a[data-page]').forEach(a=>{
      a.classList.toggle('active', a.dataset.page===path);
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    restoreState();
    markActive();
  });

  window.ROUTER = { go, back, clearAll };
})();
