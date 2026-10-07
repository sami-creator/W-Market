/* app.js — تشغيل التطبيق + متحكمات الصفحات */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), R = window.CONFIG.ROUTES;
  const $ = s => document.querySelector(s);

  /* أيقونات SVG */
  const SVG = {
    sun: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    home: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
    favs: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    notifs: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
    account: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  };

  /*
   * ترتيب الشريط السفلي من اليمين لليسار (RTL):
   * [حساب] [جرس] [+] [قلب] [بيت]
   * في grid-template-columns: 1fr 1fr 80px 1fr 1fr
   * وdirection:rtl يجعل العمود الأول أقصى اليمين
   */
  const NAV_LEFT_TO_RIGHT = [
    { route: R.HOME,    svg: 'home',    key: 'nav.home' },
    { route: R.FAVS,    svg: 'favs',    key: 'nav.favs' },
    { plus: true,       route: R.POST,  key: 'nav.add' },
    { route: R.NOTIFS,  svg: 'notifs',  key: 'nav.notifs', badge: true },
    { route: R.PROFILE, svg: 'account', key: 'nav.account', isAccount: true }
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
      document.addEventListener('langchange', () => I18n.apply());
      document.body.classList.remove('is-gated');
      console.log('[App] ready:', Router.current(), st.status);
      return st;
    },

    mountChrome() {
      /* زر الشمس → الإعدادات */
      const btnSun = document.getElementById('btn-settings-top');
      if (btnSun) {
        btnSun.innerHTML = SVG.sun;
        btnSun.addEventListener('click', () => Utils.go(R.SETTINGS));
      }

      /* الشريط السفلي */
      if (!$('.bottom-nav')) {
        const nav = document.createElement('nav');
        nav.className = 'bottom-nav';
        nav.setAttribute('aria-label', 'main');

        const items = document.createElement('div');
        items.className = 'bottom-nav__items';

        /* البناء من اليسار لليمين في DOM،
           لكن direction:rtl يعكسه بصرياً:
           DOM[0]=home → يُعرض أقصى اليمين بصرياً
           DOM[4]=account → يُعرض أقصى اليسار بصرياً
           وهو ما يطابق البروتوتايب */
        NAV_LEFT_TO_RIGHT.forEach(item => {
          if (item.plus) {
            const cell = document.createElement('div');
            cell.className = 'bottom-nav__plus-cell';
            const btn = document.createElement('button');
            btn.className = 'plus-btn';
            btn.setAttribute('aria-label', t(item.key));
            btn.textContent = '+';
            btn.addEventListener('click', () => Utils.go(item.route));
            cell.append(btn);
            items.append(cell);
          } else {
            const a = document.createElement('a');
            a.href = item.route;
            a.dataset.route = item.route;
            a.className = 'bottom-nav__item';
            a.innerHTML = SVG[item.svg];
            if (item.badge) {
              const dot = document.createElement('span');
              dot.className = 'dot-badge';
              dot.dataset.notifBadge = '';
              dot.hidden = true;
              a.append(dot);
            }
            items.append(a);
          }
        });

        nav.append(items);
        document.body.append(nav);
      }

      I18n.apply();
    },

    paintAccount(st) {
      if (st && st.profile && st.profile.avatar_url) {
        const accountLink = $('.bottom-nav a[data-route="' + R.PROFILE + '"]');
        if (accountLink) {
          const img = document.createElement('img');
          img.src = st.profile.avatar_url;
          img.alt = '';
          img.style.cssText = 'width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.8)';
          img.addEventListener('error', () => { img.replaceWith(document.createRange().createContextualFragment(SVG.account)); }, { once: true });
          accountLink.replaceChildren(img);
        }
      }
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

    const closeSub = () => { subOpen = null; subWrap.hidden = true; };
    const chip = (label, active, onClick, arrow) => {
      const b = el('button', { class: 'chip' + (active ? ' active' : ''), type: 'button' }, [label, arrow ? el('span', { class: 'arrow', text: ' ▾' }) : null]);
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
      if (m) {
        m.sub.forEach(x => sub.append(chip(Categories.label(x), s.subcategory_id === x.id, () => { closeSub(); Filters.set({ category_id: m.id, subcategory_id: x.id, attrs: {} }); })));
        subWrap.hidden = false; UI.fadeEdge(sub);
      } else subWrap.hidden = true;
    }

    document.addEventListener('click', e => {
      if (subOpen && !e.target.closest('#chips-wrap') && !e.target.closest('#sub-wrap')) { closeSub(); paintChips(); }
    });
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
          if (c.length) { Cards.renderList(grid, c); UI.toastKey('err.network', 'error'); }
          else UI.emptyState(grid, 'err.network', 'common.retry');
        }
      } finally { loading = false; }
    }

    Filters.onChange(() => { paintChips(); Filters.renderTags(tags); load(true); });
    new IntersectionObserver(es => { if (es[0].isIntersecting && !done && !loading && grid.children.length) load(false); }, { rootMargin: '400px' }).observe($('#sentinel'));
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

  /* ===== صفحات ثابتة ===== */
  App.pages.static = async function () { await App.boot(); };

  window.App = App;
  document.addEventListener('DOMContentLoaded', () => {
    const p = document.body.dataset.page;
    if (p && App.pages[p]) App.pages[p]().catch(e => console.error('[App] page', p, e));
  });
})();
