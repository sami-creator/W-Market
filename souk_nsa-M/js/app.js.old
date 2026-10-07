/* app.js — تشغيل التطبيق (الهيكل المشترك) + متحكمات صفحات: الرئيسية، المفضلة، الإشعارات، الدردشة، الإعدادات */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), R = window.CONFIG.ROUTES;
  const $ = s => document.querySelector(s);

  const NAV = [
    { route: R.HOME, icon: '🏠', key: 'nav.home' },
    { route: R.FAVS, icon: '♥', key: 'nav.favs' },
    { route: R.POST, icon: '+', key: 'nav.add', plus: true },
    { route: R.NOTIFS, icon: '🔔', key: 'nav.notifs', badge: true },
    { route: R.SETTINGS, icon: '⚙', key: 'nav.settings' }
  ];

  const App = {
    async boot({ guard = false, complete = true } = {}) {
      Theme.init();
      await I18n.init();
      SB.init();
      this.mountChrome();
      Router.bindNav();
      // لا يُعرض شيء قبل التحقق من حالة الدخول
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
      let header = $('#app-header');
      if (!header) { header = el('header', { id: 'app-header', class: 'topbar' }); document.body.prepend(header); }
      // الصورة أولًا (أقصى اليمين) ثم البانر بعرض ~60%
      const avatar = el('button', { class: 'avatar-btn', id: 'btn-account', type: 'button', 'data-i18n-aria': 'nav.account' }, el('img', { alt: '', src: 'assets/images/avatar.svg' }));
      avatar.addEventListener('click', () => Utils.go(Auth.isLogged() ? R.PROFILE : R.AUTH));
      header.prepend(el('div', { class: 'topbar__row' }, [avatar, el('div', { class: 'banner-slot', id: 'banner-slot' })]));
      if (!$('.bottom-nav')) {
        const nav = el('nav', { class: 'bottom-nav', 'aria-label': 'main' });
        NAV.forEach(n => nav.append(el('a', { href: n.route, 'data-route': n.route }, [
          n.plus ? el('span', { class: 'plus', text: '+' }) : el('span', { text: n.icon }),
          el('span', { 'data-i18n': n.key }),
          n.badge ? el('span', { class: 'dot-badge', 'data-notif-badge': '', hidden: true }) : null
        ])));
        document.body.append(nav);
      }
      I18n.apply();
    },

    paintAccount(st) {
      const img = $('#btn-account img');
      if (img && st.profile && st.profile.avatar_url) { img.src = st.profile.avatar_url; img.addEventListener('error', () => { img.src = 'assets/images/avatar.svg'; }, { once: true }); }
    },

    pages: {}
  };

  /* ===== الصفحة الرئيسية ===== */
  App.pages.home = async function () {
    await App.boot();
    await Promise.all([Categories.load(), Geo.load()]);
    const grid = $('#grid'), tags = $('#active-tags'), chips = $('#chips'), subWrap = $('#sub-wrap'), sub = $('#sub-chips');
    let page = 0, loading = false, done = false, token = 0, subOpen = null;

    Search.mount({ input: $('#q'), suggest: $('#suggest'), didYouMean: $('#dym'), button: $('#btn-search'), onSubmit: f => Filters.set(f) });
    $('#btn-filters').addEventListener('click', () => Filters.openPanel());

    const closeSub = () => { subOpen = null; subWrap.hidden = true; };
    const chip = (label, active, onClick, arrow) => {
      const b = el('button', { class: 'chip' + (active ? ' active' : ''), type: 'button' }, [label, arrow ? el('span', { class: 'arrow', text: '▾' }) : null]);
      b.addEventListener('click', e => { e.stopPropagation(); onClick(); }); return b;
    };
    function paintChips() {
      const s = Filters.get(); chips.replaceChildren();
      chips.append(chip(t('common.all'), !s.category_id, () => { closeSub(); Filters.set({ category_id: '', subcategory_id: '', attrs: {} }); }));
      Categories.all().forEach(c => chips.append(chip(Categories.label(c), s.category_id === c.id, () => {
        if (subOpen === c.id) return closeSub();
        subOpen = c.id; Filters.set({ category_id: c.id, subcategory_id: '', attrs: {} });
      }, true)));
      sub.replaceChildren();
      const m = Categories.main(subOpen);
      if (m) { m.sub.forEach(x => sub.append(chip(Categories.label(x), s.subcategory_id === x.id, () => { closeSub(); Filters.set({ category_id: m.id, subcategory_id: x.id, attrs: {} }); }))); subWrap.hidden = false; UI.fadeEdge(sub); }
      else subWrap.hidden = true;
    }
    // أي ضغطة خارج الأزرار تُخفي قائمة الأصناف الفرعية
    document.addEventListener('click', e => { if (subOpen && !e.target.closest('#chips-wrap') && !e.target.closest('#sub-wrap')) { closeSub(); paintChips(); } });
    UI.fadeEdge(chips);

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

    Filters.onChange(() => { paintChips(); Filters.renderTags(tags); load(true); });
    new IntersectionObserver(es => { if (es[0].isIntersecting && !done && !loading && grid.children.length) load(false); }, { rootMargin: '400px' }).observe($('#sentinel'));
    // الضغط على "الرئيسية" وأنت عليها: لا إعادة تحميل، فقط الصعود لأعلى
    document.addEventListener('samepage', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.addEventListener('likechange', () => Likes.paint(grid));
    document.addEventListener('langchange', () => { paintChips(); Filters.renderTags(tags); });
    paintChips(); load(true);
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

  /* ===== الإشعارات ===== */
  App.pages.notifications = async function () {
    if (!(await App.boot({ guard: true }))) return;
    Notifications.requestPermission(); Notifications.render($('#list'));
    document.addEventListener('newnotif', () => Notifications.render($('#list')));
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
