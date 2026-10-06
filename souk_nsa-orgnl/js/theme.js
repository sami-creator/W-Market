/* theme.js — الوضع الليلي/النهاري + لون التصميم + الخط */
(function () {
  'use strict';
  const C = window.CONFIG, K = C.STORAGE_KEYS;
  const GF = { cairo: 'Cairo:wght@400;600;700', tajawal: 'Tajawal:wght@400;500;700', almarai: 'Almarai:wght@400;700' };

  function loadFont(f) {
    if (!GF[f] || document.getElementById('font-' + f)) return;
    const l = document.createElement('link');
    l.id = 'font-' + f; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + GF[f] + '&display=swap';
    document.head.append(l);
  }

  const Theme = {
    init() {
      const mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
      this.setMode(Utils.Store.get(K.THEME, mq ? 'dark' : C.DEFAULTS.THEME), false);
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
      document.documentElement.style.setProperty('--font', `'${C.FONTS[f]}', system-ui, sans-serif`);
      if (save) Utils.Store.set(K.FONT, f);
    }
  };
  window.Theme = Theme;
})();
