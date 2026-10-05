/* app.js — تشغيل التطبيق + متحكمات الصفحات (الرئيسية، المفضلة، الإشعارات، الدردشة، الإعدادات) */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), R = window.CONFIG.ROUTES;
  const $ = s => document.querySelector(s);

  const NAV = [
    { route: R.HOME,   icon: '🏠', key: 'nav.home' },
    { route: R.FAVS,   icon: '♥',  key: 'nav.favs' },
    { route: R.POST,   icon: '+',  key: 'nav.add', plus: true },
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
      return st;
    },

    mountChrome() {
      let header = $('#app-header');
      if (!header) { header = el('header', { id: 'app-header', class: 'topbar' }); document.body.prepend(header); }
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

      /* ===== زر scroll-to-top ===== */
      if (!$('#scroll-top-btn')) {
        const btn = el('button', { id: 'scroll-top-btn', 'aria-label': t('common.top') || 'Top', text: '↑' });
        document.body.append(btn);
        window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 300), { passive: true });
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      }

      /* ===== تغيير لون زر الفلاتر عند وجود فلتر مفعّل ===== */
      document.addEventListener('filterschange', () => {
        const btn = $('#btn-filters');
        if (!btn) return;
        const f = Filters.get();
        const hasActive = !Filters.isDefault();
        btn.classList.toggle('has-active', hasActive);
      });

      I18n.apply();
    },

    paintAccount(st) {
      const img = $('#btn-account img');
      if (img && st.profile && st.profile.avatar_url) {
        img.src = st.profile.avatar_url;
        img.addEventListener('error', () => { img.src = 'assets/images/avatar.svg'; }, { once: true });
      }
    },

    pages: {}
  };

  /* ===== الصفحة الرئيسية ===== */
  App.pages.home = async function () {
    await App.boot();
    await Promise.all([Categories.load(), Geo.load()]);

    const grid    = $('#grid');
    const tags    = $('#active-tags');
    const chips   = $('#chips');
    const subWrap = $('#sub-wrap');
    const sub     = $('#sub-chips');

    let page = 0, loading = false, done = false, token = 0, subOpen = null;

    /* ===== استعادة حالة التنقل (فلاتر + صنف + بحث) ===== */
    const NAV_KEY = 'snsa_nav_state';
    let navState = {};
    try { navState = JSON.parse(sessionStorage.getItem(NAV_KEY) || '{}'); } catch (e) {}
    if (navState.filters) {
      try { Filters.set(JSON.parse(navState.filters)); } catch (e) {}
    }

    function saveNavState() {
      try { sessionStorage.setItem(NAV_KEY, JSON.stringify({ filters: JSON.stringify(Filters.get()) })); } catch (e) {}
    }

    /* ===== بحث ===== */
    Search.mount({
      input: $('#q'),
      suggest: $('#suggest'),
      didYouMean: $('#dym'),
      button: $('#btn-search'),
      onSubmit: f => { Filters.set(f); saveNavState(); }
    });

    $('#btn-filters').addEventListener('click', () => Filters.openPanel());

    /* ===== شرائح الأصناف ===== */
    const closeSub = () => { subOpen = null; subWrap.hidden = true; };

    const chip = (label, active, onClick, arrow) => {
      const b = el('button', { class: 'chip' + (active ? ' active' : ''), type: 'button' }, [
        label,
        arrow ? el('span', { class: 'arrow', text: '▾' }) : null
      ]);
      b.addEventListener('click', e => { e.stopPropagation(); onClick(); });
      return b;
    };

    function paintChips() {
      const s = Filters.get();
      chips.replaceChildren();
      chips.append(chip(t('common.all'), !s.category_id, () => {
        closeSub(); Filters.set({ category_id: '', subcategory_id: '', attrs: {} }); saveNavState();
      }));
      Categories.all().forEach(c => chips.append(chip(Categories.label(c), s.category_id === c.id, () => {
        if (subOpen === c.id) return closeSub();
        subOpen = c.id;
        Filters.set({ category_id: c.id, subcategory_id: '', attrs: {} });
        saveNavState();
      }, true)));
      sub.replaceChildren();
      const m = Categories.main(subOpen || (s.category_id ? s.category_id : null));
      if (m) {
        m.sub.forEach(x => sub.append(chip(Categories.label(x), s.subcategory_id === x.id, () => {
          closeSub(); Filters.set({ category_id: m.id, subcategory_id: x.id, attrs: {} }); saveNavState();
        })));
        subWrap.hidden = false;
        UI.fadeEdge(sub);
      } else {
        subWrap.hidden = true;
      }
    }

    document.addEventListener('click', e => {
      if (subOpen && !e.target.closest('#chips-wrap') && !e.target.closest('#sub-wrap')) {
        closeSub(); paintChips();
      }
    });
    UI.fadeEdge(chips);

    /* ===== تحميل الإعلانات ===== */
    async function load(reset) {
      if (loading && !reset) return;
      if (reset) { page = 0; done = false; token++; grid.replaceChildren(UI.skeletonCards(6)); }
      loading = true;
      const my = token, f = Filters.get();
      try {
        let res;
        if (f.sort === 'near' && f.coords)  res = await Ads.nearby(f.coords, f, page);
        else if (Filters.isDefault())        res = await Ads.home(page);
        else                                 res = await Ads.list(f, page);

        if (my !== token) return;
        if (reset) grid.replaceChildren();
        Cards.renderList(grid, res.items, { append: true });
        Likes.paint(grid);
        if (page === 0 && Filters.isDefault() && res.items.length) OfflineCache.saveFeed(res.items);
        if (reset && !res.items.length) UI.emptyState(grid);
        done = !res.hasMore;
        page++;
      } catch (e) {
        console.error('[Home] load', e);
        if (reset) {
          grid.replaceChildren();
          const c = OfflineCache.loadFeed();
          if (c.length) { Cards.renderList(grid, c); UI.toastKey('err.network', 'error'); }
          else UI.emptyState(grid, 'err.network', 'common.retry');
        }
      } finally {
        loading = false;
      }
    }

    Filters.onChange(() => {
      paintChips();
      Filters.renderTags(tags);
      /* إرسال حدث لتغيير لون زر الفلاتر */
      document.dispatchEvent(new CustomEvent('filterschange'));
      saveNavState();
      load(true);
    });

    new IntersectionObserver(es => {
      if (es[0].isIntersecting && !done && !loading && grid.children.length) load(false);
    }, { rootMargin: '400px' }).observe($('#sentinel'));

    document.addEventListener('samepage', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.addEventListener('likechange', () => Likes.paint(grid));
    document.addEventListener('langchange', () => { paintChips(); Filters.renderTags(tags); });

    paintChips();
    Filters.renderTags(tags);
    load(true);
  };

  /* ===== المفضلة ===== */
  App.pages.favorites = async function () {
    if (!(await App.boot({ guard: true }))) return;
    const grid = $('#grid');
    grid.replaceChildren(UI.skeletonCards(4));
    try {
      await Likes.load();
      const items = await Likes.listMine();
      grid.replaceChildren();
      if (!items.length) return UI.emptyState(grid);
      Cards.renderList(grid, items);
      Likes.paint(grid);
    } catch (e) {
      console.error('[Favs]', e);
      UI.emptyState(grid, 'err.generic', 'common.retry');
    }
  };

  /* ===== الإشعارات ===== */
  App.pages.notifications = async function () {
    if (!(await App.boot({ guard: true }))) return;
    Notifications.requestPermission();
    Notifications.render($('#list'));
    document.addEventListener('newnotif', () => Notifications.render($('#list')));
  };

  /* ===== الدردشة ===== */
  App.pages.chat = async function () {
    if (!(await App.boot({ guard: true }))) return;
    const c = Utils.qs('c'), root = $('#chat-root');
    if (c && /^[0-9a-f-]{36}$/i.test(c)) Chat.open(c, root);
    else Chat.list(root);
    window.addEventListener('pagehide', () => Chat.close());
  };

  /* ===== الإعدادات ===== */
  App.pages.settings = async function () {
    await App.boot();
    Settings.render($('#settings-root'));
    document.addEventListener('langchange', () => Settings.render($('#settings-root')));
  };

  /* ===== صفحات ثابتة ===== */
  App.pages.static = async function () { await App.boot(); };

  window.App = App;
  document.addEventListener('DOMContentLoaded', () => {
    const p = document.body.dataset.page;
    if (p && App.pages[p]) App.pages[p]().catch(e => console.error('[App] page', p, e));
  });
})();
