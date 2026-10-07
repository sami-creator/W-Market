/* theme.js — الوضع الليلي/النهاري + لون التصميم + الخط */
(function () {
  'use strict';
  const C = window.CONFIG, K = C.STORAGE_KEYS;

  function loadFont(f) {
    if (!C.FONTS[f] || document.getElementById('font-' + f)) return;
    // الخطوط النظامية وتايمز لا تحتاج تحميل
    if (f === 'system' || f === 'times') return;
    const GF_MAP = {
      cairo: 'Cairo:wght@400;600;700',
      tajawal: 'Tajawal:wght@400;500;700',
      almarai: 'Almarai:wght@400;700',
      scheherazade: 'Scheherazade+New:wght@400;700',
      lateef: 'Lateef:wght@400;700'
    };
    if (!GF_MAP[f]) return;
    const l = document.createElement('link');
    l.id = 'font-' + f; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + GF_MAP[f] + '&display=swap';
    document.head.append(l);
  }

  const Theme = {
    init() {
      // الوضع الليلي افتراضياً إذا لم يختر المستخدم شيئاً بعد
      const savedTheme = Utils.Store.get(K.THEME, null);
      const defaultTheme = savedTheme !== null ? savedTheme : C.DEFAULTS.THEME;
      this.setMode(defaultTheme, false);
      this.setColor(Utils.Store.get(K.COLOR, C.DEFAULTS.COLOR), false);
      this.setFont(Utils.Store.get(K.FONT, C.DEFAULTS.FONT), false);
    },
    setMode(m, save = true) {
      m = m === 'dark' ? 'dark' : 'light';
      document.documentElement.dataset.theme = m;
      if (save) Utils.Store.set(K.THEME, m);
    },
    toggleMode() { this.setMode(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); },
    setColor(c, save = true) {
      if (!C.COLORS.includes(c)) c = C.DEFAULTS.COLOR;
      document.documentElement.dataset.color = c;
      if (save) Utils.Store.set(K.COLOR, c);
    },
    setFont(f, save = true) {
      if (!C.FONTS[f]) f = C.DEFAULTS.FONT;
      loadFont(f);
      document.documentElement.dataset.font = f;
      document.documentElement.style.setProperty('--font', C.FONTS[f] + ', system-ui, sans-serif');
      if (save) Utils.Store.set(K.FONT, f);
    }
  };
  window.Theme = Theme;
})();
