/* router.js — تنقل بلا إعادة تحميل غير ضرورية + حراسة الصفحات */
(function () {
  'use strict';
  const R = window.CONFIG.ROUTES;

  function currentRoute() {
    const p = location.pathname.split('/').pop();
    return p ? (p.endsWith('.html') ? p : p + '.html') : R.HOME;
  }

  const Router = {
    current: currentRoute,
    // رجوع آمن: التاريخ إن وُجد، وإلا الرئيسية (الفلاتر والبحث محفوظة في Filters فلا تضيع)
    back() { if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) history.back(); else Utils.go(R.HOME); },
    // الضغط على رابط صفحة أنت عليها لا يعيد التحميل
    bindNav(root = document) {
      const cur = currentRoute();
      root.querySelectorAll('[data-route]').forEach(a => {
        const target = a.dataset.route;
        if (target === cur) a.classList.add('active');
        a.addEventListener('click', e => {
          e.preventDefault();
          if (target === currentRoute()) {
            document.dispatchEvent(new CustomEvent('samepage', { detail: target }));
            return;
          }
          Utils.go(target);
        });
      });
    },
    // صفحات تحتاج تسجيل الدخول: تنتظر التحقق قبل أي عرض
    async guard({ complete = true } = {}) {
      document.body.classList.add('is-gated');
      const st = await Auth.ready();
      if (st.status === 'guest') { this.toLogin(); return null; }
      if (complete && st.status === 'partial') { Utils.go(R.COMPLETE); return null; }
      document.body.classList.remove('is-gated');
      return st;
    },
    toLogin() {
      sessionStorage.setItem('sn_return', location.pathname.split('/').pop() + location.search);
      Utils.go(R.AUTH);
    },
    afterLogin() {
      const back = sessionStorage.getItem('sn_return');
      sessionStorage.removeItem('sn_return');
      if (back && /^[a-z0-9\-]+(\.html)?(\?[^\s]*)?$/i.test(back)) location.href = back;
      else Utils.go(R.PROFILE);
    }
  };
  window.Router = Router;
})();
