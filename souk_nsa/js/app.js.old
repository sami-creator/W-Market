/* app.js — الهيكل المشترك (ترويسة/شريط سفلي/زر عائم) + متحكمات الصفحات: الرئيسية، المفضلة، الإشعارات، الدردشة، الإعدادات */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), R = window.CONFIG.ROUTES;
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';

  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    heart: '<path d="M12 21s-6.7-4.35-9.33-8.02C.86 10.6 1.2 7.3 3.6 5.4 5.8 3.66 8.9 4.1 10.6 6.1L12 7.7l1.4-1.6c1.7-2 4.8-2.44 7-.7 2.4 1.9 2.74 5.2 0.93 7.58C18.7 16.65 12 21 12 21z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'
  };
  const icon = k => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.innerHTML = ICONS[k]; return s; };
  const TITLES = { 'ad-details': 'ad.details', profile: 'nav.account', auth: 'nav.account', complete: 'nav.account' };

  const App = {
    async boot({ guard = false, complete = true } = {}) {
      Theme.init();
      await I18n.init();
      SB.init();
      this.mountChrome();
      Router.bindNav();
      const st = guard ? await Router.guard({ complete }) : await Auth.ready();
      if (!st) return null;
      this.paintAccount(st);
      if (Auth.isLogged()) {
        Likes.load().then(() => Likes.paint());
        Notifications.init(); Fingerprint.register(); Auth.updateLastSeen();
      }
      Tracking.init();
      Banners.mount($('#banner-slot'));
      document.addEventListener('langchange', () => I18n.apply());
      document.body.classList.remove('is-gated');
      console.log('[App] ready:', Router.current(), st.status);
      return st;
    },

    mountChrome() {
      const page = document.body.dataset.page;
      // الصفحات الداخلية: بانر (إن وُجد) ثم ترويسة بزر رجوع + عنوان بنفس تصميم prototype
      if (page !== 'home' && !$('.page-header')) {
        if (!$('#banner-slot')) document.body.prepend(el('div', { class: 'banner-slot banner-top', id: 'banner-slot', hidden: true }));
        const h1 = document.querySelector('main h1.page-title');
        const title = h1 || el('h1', { class: 'page-title', 'data-i18n': TITLES[page] || 'app.name' });
        const back = el('button', { class: 'back', type: 'button', 'aria-label': t('common.back'), text: '‹' });
        back.addEventListener('click', () => Router.back());
        const header = el('header', { class: 'page-header' }, [back, title]);
        const slot = $('#banner-slot');
        slot.after(header);
      }

      if (!$('.bottom-bar')) {
        const bar = el('nav', { class: 'bottom-bar', id: 'bottomBar', 'aria-label': 'main' });
        const item = (route, key, ic, badge) => {
          const a = el('a', { class: 'nav-item', href: route, 'data-route': route, 'aria-label': t(key) }, [badge ? el('span', { class: 'dot-badge', 'data-notif-badge': '', hidden: true }) : null]);
          a.prepend(icon(ic)); return a;
        };
        // RTL: الرئيسية أقصى اليمين ← المفضلة ← (زر +) ← الإشعارات ← حسابي أقصى اليسار
        const account = el('button', { class: 'nav-item', id: 'btn-account', type: 'button', 'aria-label': t('nav.account') }, [
          el('div', { class: 'nav-profile' }, [el('img', { alt: '', src: 'assets/images/avatar.svg' }), el('div', { class: 'nav-dot off' })])
        ]);
        if (page === 'profile') account.classList.add('active');
        account.addEventListener('click', () => Utils.go(Auth.isLogged() ? R.PROFILE : R.AUTH));
        bar.append(item(R.HOME, 'nav.home', 'home'), item(R.FAVS, 'nav.favs', 'heart'), el('div', { class: 'fab-spacer' }), item(R.NOTIFS, 'nav.notifs', 'bell', true), account);
        const fab = el('a', { class: 'fab', id: 'fab', href: R.POST, 'aria-label': t('nav.add') });
        fab.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
        fab.addEventListener('click', e => { e.preventDefault(); Utils.go(R.POST); });
        const top = el('button', { class: 'to-top', id: 'toTop', type: 'button', 'aria-label': 'top' });
        top.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
        top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        document.body.append(bar, fab, top);
        this.bindScroll(bar, fab, top); this.syncNotch(bar);
      }
      I18n.apply();
    },

    // الشريط السفلي والزر + يختفيان عند النزول ويظهران عند الصعود
    bindScroll(bar, fab, top) {
      let last = window.scrollY, hidden = false;
      window.addEventListener('scroll', () => {
        const y = window.scrollY, d = y - last;
        if (d > 12 && y > 60 && !hidden) { bar.classList.add('hidden'); fab.classList.add('hidden'); hidden = true; }
        else if (d < -8 && hidden) { bar.classList.remove('hidden'); fab.classList.remove('hidden'); hidden = false; }
        top.classList.toggle('show', y > 700);
        last = y;
      }, { passive: true });
    },

    // الحفرة المنحنية خلف الزر العائم (مطابقة لـ prototype)
    syncNotch(bar) {
      const draw = () => {
        const w = bar.offsetWidth, h = bar.offsetHeight; if (!w) return;
        const m = w / 2, hs = 28, dp = 14, x1 = m - hs, x2 = m + hs;
        const path = `M0,0 L${x1},0 C${m - hs * .55},0 ${m - hs * .65},${dp} ${m},${dp} C${m + hs * .65},${dp} ${m + hs * .55},0 ${x2},0 L${w},0 L${w},${h} L0,${h} Z`;
        bar.style.clipPath = bar.style.webkitClipPath = `path('${path}')`;
      };
      new ResizeObserver(draw).observe(bar); draw();
    },

    paintAccount(st) {
      const img = $('#btn-account img'), dot = $('#btn-account .nav-dot');
      if (dot) dot.classList.toggle('off', !Auth.isLogged());
      if (img && st.profile && st.profile.avatar_url) { img.src = Utils.imgUrl(st.profile.avatar_url, 'thumb'); img.addEventListener('error', () => { img.src = 'assets/images/avatar.svg'; }, { once: true }); }
    },

    pages: {}
  };

  /* ===== الصفحة الرئيسية ===== */
  App.pages.home = async function () {
    await App.boot();
    await Promise.all([Categories.load(), Geo.load()]);
    const grid = $('#grid'), tags = $('#active-tags'), chips = $('#chips'), subWrap = $('#sub-wrap'), sub = $('#sub-chips');
    let page = 0, loading = false, done = false, token = 0;
    // آخر صنف/صنف فرعي مفعّل (محفوظ) يظهر مفتوحًا عند الدخول
    let subOpen = Filters.get().subcategory_id ? Filters.get().category_id : null;

    Search.mount({ input: $('#q'), suggest: $('#suggest'), didYouMean: $('#dym'), button: $('#btn-search'), onSubmit: f => Filters.set(f) });
    $('#btn-filters').addEventListener('click', () => Filters.openPanel());
    const paintFilterBtn = () => $('#btn-filters').classList.toggle('has-filters', Filters.hasActive());

    const closeSub = () => { subOpen = null; subWrap.hidden = true; };
    const chip = (label, active, onClick, arrow, rotated) => {
      const b = el('button', { class: 'chip' + (active ? ' active' : ''), type: 'button' }, [label, arrow ? el('span', { class: 'arrow' + (rotated ? ' rotated' : ''), text: '▼' }) : null]);
      b.addEventListener('click', e => { e.stopPropagation(); onClick(); }); return b;
    };
    function paintChips() {
      const s = Filters.get(); chips.replaceChildren();
      chips.append(chip(t('common.all'), !s.category_id, () => { closeSub(); Filters.set({ category_id: '', subcategory_id: '', attrs: {} }); }));
      Categories.all().forEach(c => chips.append(chip(Categories.label(c), s.category_id === c.id, () => {
        if (subOpen === c.id) { closeSub(); return paintChips(); }
        subOpen = c.id; Filters.set({ category_id: c.id, subcategory_id: '', attrs: {} });
      }, true, subOpen === c.id)));
      sub.replaceChildren();
      const m = Categories.main(subOpen);
      if (m) {
        sub.append(chip(t('common.all'), s.category_id === m.id && !s.subcategory_id, () => { Filters.set({ category_id: m.id, subcategory_id: '', attrs: {} }); }));
        m.sub.forEach(x => sub.append(chip(Categories.label(x), s.subcategory_id === x.id, () => { Filters.set({ category_id: m.id, subcategory_id: x.id, attrs: {} }); })));
        subWrap.hidden = false;
      } else subWrap.hidden = true;
    }
    // أي ضغطة خارج الأزرار تُخفي قائمة الأصناف الفرعية
    document.addEventListener('click', e => { if (subOpen && !e.target.closest('#chips-wrap') && !e.target.closest('#sub-wrap')) { closeSub(); paintChips(); } });

    async function load(reset) {
      if (loading && !reset) return;
      if (reset) { page = 0; done = false; token++; grid.replaceChildren(UI.skeletonCards(6)); }
      loading = true; const my = token, f = Filters.get();
      try {
        let res;
        if (f.sort === 'near' && f.coords) res = await Ads.nearby(f.coords, f, page);
        else if (Filters.isDefault()) res = await Ads.home(page);
        else res = await Ads.list(f, page);
        if (my !== token) return;
        if (reset) grid.replaceChildren();
        Cards.renderList(grid, res.items, { append: true }); Likes.paint(grid);
        if (page === 0 && Filters.isDefault() && res.items.length) OfflineCache.saveFeed(res.items);
        if (reset && !res.items.length) UI.emptyState(grid);
        done = !res.hasMore; page++;
      } catch (e) {
        console.error('[Home] load', e);
        if (reset) {
          grid.replaceChildren(); const c = OfflineCache.loadFeed();
          if (c.length) { Cards.renderList(grid, c); UI.toastKey('err.network', 'error'); } else UI.emptyState(grid, 'err.network', 'common.retry');
        }
      } finally { loading = false; }
    }

    Filters.onChange(() => { paintChips(); paintFilterBtn(); Filters.renderTags(tags); load(true); });
    new IntersectionObserver(es => { if (es[0].isIntersecting && !done && !loading && grid.children.length) load(false); }, { rootMargin: '400px' }).observe($('#sentinel'));
    document.addEventListener('samepage', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.addEventListener('likechange', () => Likes.paint(grid));
    document.addEventListener('langchange', () => { paintChips(); Filters.renderTags(tags); });

    // العودة من إعلان: استعادة موضع التمرير وعدد الصفحات المحمّلة
    const SCROLL_KEY = 'sn_home_scroll';
    window.addEventListener('pagehide', () => { try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ y: window.scrollY, pages: page })); } catch { /* ignore */ } });
    paintChips(); paintFilterBtn(); Filters.renderTags(tags);
    await load(true);
    try {
      const nav = performance.getEntriesByType('navigation')[0], sv = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || 'null');
      if (sv && nav && nav.type === 'back_forward') {
        while (page < Math.min(sv.pages, 6) && !done) await load(false);
        window.scrollTo({ top: sv.y });
      }
      sessionStorage.removeItem(SCROLL_KEY);
    } catch { /* ignore */ }
  };

  /* ===== المفضلة ===== */
  App.pages.favorites = async function () {
    if (!(await App.boot({ guard: true }))) return;
    const grid = $('#grid'); grid.replaceChildren(UI.skeletonCards(4));
    try {
      await Likes.load(); const items = await Likes.listMine(); grid.replaceChildren();
      if (!items.length) return UI.emptyState(grid);
      Cards.renderList(grid, items); Likes.paint(grid);
    } catch (e) { console.error('[Favs]', e); UI.emptyState(grid, 'err.generic', 'common.retry'); }
  };

  /* ===== الإشعارات + التنبيه المخصص ===== */
  App.pages.notifications = async function () {
    if (!(await App.boot({ guard: true }))) return;
    Notifications.requestPermission(); Notifications.render($('#list'));
    document.addEventListener('newnotif', () => Notifications.render($('#list')));
    const box = $('#alerts-root'); if (box) Alerts.render(box);
  };

  /* ===== الدردشة ===== */
  App.pages.chat = async function () {
    if (!(await App.boot({ guard: true }))) return;
    const c = Utils.qs('c'), root = $('#chat-root');
    if (c && /^[0-9a-f-]{36}$/i.test(c)) Chat.open(c, root); else Chat.list(root);
    window.addEventListener('pagehide', () => Chat.close());
  };

  /* ===== الإعدادات ===== */
  App.pages.settings = async function () {
    await App.boot(); Settings.render($('#settings-root'));
    document.addEventListener('langchange', () => Settings.render($('#settings-root')));
  };

  /* ===== صفحات ثابتة (خصوصية / 404) ===== */
  App.pages.static = async function () { await App.boot(); };

  window.App = App;
  document.addEventListener('DOMContentLoaded', () => {
    const p = document.body.dataset.page;
    if (p && App.pages[p]) App.pages[p]().catch(e => console.error('[App] page', p, e));
  });
})();
