/* router.js — تنقل بلا إعادة تحميل غير ضرورية + حراسة الصفحات + حفظ حالة التنقل (صنف/بحث/فلاتر/موضع التمرير) */
(function () {
  'use strict';
  const R = window.CONFIG.ROUTES, NAV_KEY = window.CONFIG.STORAGE_KEYS.NAV_STATE, FILT_KEY = window.CONFIG.STORAGE_KEYS.FILTERS;

  function currentRoute() {
    const p = location.pathname.split('/').pop();
    return p ? (p.endsWith('.html') ? p : p + '.html') : R.HOME;
  }

  const Router = {
    current: currentRoute,
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
    },

    /* ===== حفظ حالة التنقل (sessionStorage يبقى طوال النافذة) ===== */
    state() {
      try { return JSON.parse(sessionStorage.getItem(NAV_KEY) || '{}') || {}; } catch (e) { return {}; }
    },
    saveState(patch) {
      try { sessionStorage.setItem(NAV_KEY, JSON.stringify(Object.assign(this.state(), patch))); } catch (e) { /* ignore */ }
    },
    // عند تسجيل الخروج أو "إعادة الضبط"
    clearState() {
      try { sessionStorage.removeItem(NAV_KEY); sessionStorage.removeItem(FILT_KEY); } catch (e) { /* ignore */ }
    },
    back() {
      if (history.length > 1) history.back(); else Utils.go(R.HOME);
    }
  };
  window.Router = Router;
})();
