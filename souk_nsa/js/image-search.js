/* image-search.js — ربط زر البحث بالصورة بـ Search.mountImageSearch
   يُحمَّل بعد search.js في index.html */
(function () {
  'use strict';

  function init() {
    const imgBtn   = document.getElementById('btn-img-search');
    const fileInput = document.getElementById('img-search-input');
    if (!imgBtn || !fileInput) return;

    /* تعيين aria-label بعد تحميل الترجمة */
    const setLabel = () => {
      const lbl = I18n && I18n.t ? I18n.t('search.image_btn') : 'بحث بصورة';
      imgBtn.setAttribute('aria-label', lbl);
      imgBtn.title = lbl;
    };
    setLabel();
    document.addEventListener('langchange', setLabel);

    Search.mountImageSearch({
      btn: imgBtn,
      fileInput,
      onResults(results) {
        /* نُطلق حدث مخصص يلتقطه app.js لعرض النتائج */
        document.dispatchEvent(new CustomEvent('imagesearchresults', { detail: { results } }));
      }
    });
  }

  /* ننتظر جاهزية الصفحة */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
