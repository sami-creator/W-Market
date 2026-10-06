/* theme.js — الوضع الليلي/النهاري + لون التصميم (15 لونًا) + الخط (Times New Roman افتراضي) + زر العودة للأعلى */
(function () {
  'use strict';
  const C = window.CONFIG, K = C.STORAGE_KEYS;
  const ROOT = document.documentElement;

  // تخزين آمن (لا يعتمد على تحميل Utils قبله)
  const store = {
    get(key, fb) { try { const v = localStorage.getItem(key); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ } }
  };

  function loadFont(f) {
    const q = C.FONT_GF && C.FONT_GF[f];
    if (!q || document.getElementById('font-' + f)) return;
    const l = document.createElement('link');
    l.id = 'font-' + f; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + q + '&display=swap';
    document.head.append(l);
  }

  const Theme = {
    init() {
      this.setMode(store.get(K.THEME, C.DEFAULTS.THEME), false);
      this.setColor(store.get(K.COLOR, C.DEFAULTS.COLOR), false);
      this.setFont(store.get(K.FONT, C.DEFAULTS.FONT), false);
    },
    setMode(m, save = true) {
      m = m === 'light' ? 'light' : 'dark';
      ROOT.dataset.theme = m;
      if (save) store.set(K.THEME, m);
    },
    toggleMode() { this.setMode(ROOT.dataset.theme === 'dark' ? 'light' : 'dark'); },
    setColor(c, save = true) {
      if (!C.COLORS.includes(c)) c = C.DEFAULTS.COLOR;
      ROOT.dataset.color = c;
      if (save) store.set(K.COLOR, c);
    },
    setFont(f, save = true) {
      if (!C.FONTS[f]) f = C.DEFAULTS.FONT;
      loadFont(f);
      ROOT.dataset.font = f;
      ROOT.style.setProperty('--font', C.FONT_STACKS[f]);
      if (save) store.set(K.FONT, f);
    },

    // زر العودة للأعلى: يُنشأ تلقائيًا في كل الصفحات ويظهر بعد التمرير 300px
    initScrollTop() {
      if (this._scrollInit) return; this._scrollInit = true;
      let btn = document.getElementById('scroll-top-btn');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'scroll-top-btn'; btn.type = 'button'; btn.textContent = '↑';
        btn.setAttribute('aria-label', 'top');
        document.body.append(btn);
      }
      const onScroll = () => btn.classList.toggle('visible', (window.scrollY || document.documentElement.scrollTop) > 300);
      window.addEventListener('scroll', onScroll, { passive: true });
      btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      onScroll();
    }
  };
  window.Theme = Theme;

  // تطبيق مبكر لتفادي وميض الألوان قبل اكتمال التحميل
  Theme.init();
  if (document.readyState !== 'loading') Theme.initScrollTop();
  else document.addEventListener('DOMContentLoaded', () => Theme.initScrollTop());
})();
