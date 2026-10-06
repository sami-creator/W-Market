/* filters.js — حالة الفلاتر + اللوحة المنبثقة + شارات الفلاتر النشطة (قابلة للإزالة) */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k);
  const EMPTY = () => ({ q: '', category_id: '', subcategory_id: '', wilaya_ids: [], daira_ids: [], commune_ids: [], min_price: null, max_price: null, sort: '', order: 'desc', delivery: false, verified_only: false, attrs: {} });
  let state = EMPTY(), cb = () => {};

  async function ensureLocation() {
    return new Promise(res => {
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res(null), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
    });
  }

  function checks(name, items, selected, labelFn) {
    const box = el('div', { class: 'multi' });
    items.forEach(o => {
      const cb = el('input', { type: 'checkbox', value: o.id, name });
      cb.checked = selected.map(String).includes(String(o.id));
      box.append(el('label', {}, [cb, labelFn(o)]));
    });
    return box;
  }
  const picked = box => [...box.querySelectorAll('input:checked')].map(i => Number(i.value));

  const Filters = {
    get() { return state; },
    set(patch) { state = Object.assign(state, patch); cb(state); },
    reset() { state = EMPTY(); cb(state); },
    onChange(fn) { cb = fn; },
    isDefault() { return JSON.stringify(state) === JSON.stringify(EMPTY()); },
    async location() { return ensureLocation(); },

    // شارات الفلاتر النشطة مع زر إزالة لكل فلتر
    renderTags(container) {
      container.replaceChildren();
      const add = (text, clear) => container.append(el('span', { class: 'tag' }, [text, el('button', { type: 'button', 'aria-label': t('filters.remove'), onclick: () => { clear(); cb(state); Filters.renderTags(container); } }, '×')]));
      if (state.category_id) add(Categories.label(Categories.main(state.category_id)), () => { state.category_id = ''; state.subcategory_id = ''; state.attrs = {}; });
      if (state.subcategory_id) { const s = Categories.findSub(state.subcategory_id); add(Categories.label(s && s.sub), () => { state.subcategory_id = ''; state.attrs = {}; }); }
      state.wilaya_ids.forEach(id => add(Geo.label(Geo.wilaya(id)), () => { state.wilaya_ids = state.wilaya_ids.filter(x => x !== id); }));
      state.daira_ids.forEach(id => add(Geo.label(Geo.daira(id)), () => { state.daira_ids = state.daira_ids.filter(x => x !== id); }));
      state.commune_ids.forEach(id => add(Geo.label(Geo.commune(id)), () => { state.commune_ids = state.commune_ids.filter(x => x !== id); }));
      if (state.min_price) add(t('filters.price_from') + ' ' + Utils.formatNumber(state.min_price), () => { state.min_price = null; });
      if (state.max_price) add(t('filters.price_to') + ' ' + Utils.formatNumber(state.max_price), () => { state.max_price = null; });
      if (state.delivery) add(t('filters.delivery'), () => { state.delivery = false; });
      if (state.verified_only) add(t('filters.verified'), () => { state.verified_only = false; });
      if (state.sort) add(t('filters.sort') + ': ' + t('filters.sort_' + (state.sort === 'near' ? 'near' : state.sort)), () => { state.sort = ''; });
      Object.entries(state.attrs).forEach(([k, v]) => add(v, () => { delete state.attrs[k]; }));
    },

    async openPanel() {
      await Promise.all([Geo.load(), Categories.load()]);
      const ov = el('div', { class: 'filters-panel' }), sheet = el('div', { class: 'filters-panel__sheet' });
      const field = (label, node) => el('div', { class: 'field' }, [el('label', { text: label }), node]);
      const tmp = JSON.parse(JSON.stringify(state));

      const selCat = el('select', { class: 'input' });
      selCat.append(new Option(t('common.all'), ''));
      Categories.all().forEach(c => selCat.append(new Option(Categories.label(c), c.id)));
      selCat.value = tmp.category_id;
      const selSub = el('select', { class: 'input' });
      const attrsBox = el('div');
      const fillSub = () => {
        selSub.replaceChildren(new Option(t('common.all'), ''));
        const m = Categories.main(selCat.value);
        (m ? m.sub : []).forEach(s => selSub.append(new Option(Categories.label(s), s.id)));
        selSub.value = tmp.subcategory_id || ''; fillAttrs();
      };
      // فلاتر خاصة بالصنف الفرعي فقط، وتظهر عند اختياره
      const fillAttrs = () => {
        attrsBox.replaceChildren();
        Categories.filtersFor(selSub.value).forEach(f => {
          if (f.type === 'select') {
            const s = el('select', { class: 'input', 'data-attr': f.key }); s.append(new Option(t('common.all'), ''));
            f.options.forEach(o => s.append(new Option(o, o))); s.value = tmp.attrs[f.key] || '';
            attrsBox.append(field(f.key, s));
          } else {
            attrsBox.append(field(f.key, el('input', { class: 'input', 'data-attr': f.key, maxlength: f.max || 30, value: tmp.attrs[f.key] || '' })));
          }
        });
      };
      selCat.addEventListener('change', () => { tmp.subcategory_id = ''; fillSub(); });
      selSub.addEventListener('change', () => { tmp.attrs = {}; fillAttrs(); });
      fillSub();

      const wBox = checks('w', Geo.wilayas(), tmp.wilaya_ids, o => Geo.label(o));
      const dBox = el('div'), cBox = el('div');
      const refreshD = () => {
        const w = picked(wBox); dBox.replaceChildren(); cBox.replaceChildren();
        if (w.length) dBox.append(checks('d', Geo.dairas(w), tmp.daira_ids, o => Geo.label(o)));
        refreshC();
      };
      const refreshC = () => {
        const d = picked(dBox); cBox.replaceChildren();
        if (d.length) cBox.append(checks('c', Geo.communes(d), tmp.commune_ids, o => Geo.label(o)));
      };
      wBox.addEventListener('change', refreshD); dBox.addEventListener('change', refreshC); refreshD();

      const pMin = el('input', { class: 'input', type: 'number', inputmode: 'numeric', min: 1, value: tmp.min_price || '' });
      const pMax = el('input', { class: 'input', type: 'number', inputmode: 'numeric', min: 1, value: tmp.max_price || '' });
      const sort = el('select', { class: 'input' });
      [['', 'common.all'], ['views', 'filters.sort_views'], ['rating', 'filters.sort_rating'], ['price', 'filters.sort_price'], ['new', 'filters.sort_new'], ['near', 'filters.sort_near']]
        .forEach(([v, k]) => sort.append(new Option(t(k), v))); sort.value = tmp.sort;
      const order = el('select', { class: 'input' });
      order.append(new Option(t('filters.desc'), 'desc'), new Option(t('filters.asc'), 'asc')); order.value = tmp.order;
      const dl = el('input', { type: 'checkbox' }); dl.checked = tmp.delivery;
      const vf = el('input', { type: 'checkbox' }); vf.checked = tmp.verified_only;

      const apply = el('button', { class: 'btn btn--primary grow', type: 'button' }, t('filters.apply'));
      const reset = el('button', { class: 'btn btn--ghost', type: 'button' }, t('filters.reset'));
      apply.addEventListener('click', async () => {
        const next = {
          category_id: selCat.value, subcategory_id: selSub.value,
          wilaya_ids: picked(wBox), daira_ids: picked(dBox), commune_ids: picked(cBox),
          min_price: Number(pMin.value) || null, max_price: Number(pMax.value) || null,
          sort: sort.value, order: order.value, delivery: dl.checked, verified_only: vf.checked, attrs: {}
        };
        attrsBox.querySelectorAll('[data-attr]').forEach(i => { const v = Sanitize.cleanText(i.value, 30); if (v) next.attrs[i.dataset.attr] = v; });
        // "الأقرب مني" يتطلب صلاحية الموقع، وإن رُفضت لا يُفعَّل الفلتر
        if (next.sort === 'near') {
          const c = await ensureLocation();
          if (!c) { UI.toastKey('geo.locate_denied', 'error'); return; }
          next.coords = c;
        }
        Filters.set(next); ov.remove();
      });
      reset.addEventListener('click', () => { Filters.reset(); ov.remove(); });
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });

      sheet.append(
        el('h3', { text: t('filters.title') }),
        field(t('filters.category'), selCat), field(t('filters.subcategory'), selSub), attrsBox,
        field(t('geo.wilaya'), wBox), field(t('geo.daira'), dBox), field(t('geo.commune'), cBox),
        el('div', { class: 'row' }, [field(t('filters.price_from'), pMin), field(t('filters.price_to'), pMax)]),
        el('div', { class: 'row' }, [field(t('filters.sort'), sort), field('', order)]),
        el('label', { class: 'row' }, [dl, t('filters.delivery')]),
        el('label', { class: 'row' }, [vf, t('filters.verified')]),
        el('div', { class: 'filters-panel__foot' }, [apply, reset])
      );
      ov.append(sheet); document.body.append(ov);
    }
  };
  window.Filters = Filters;
})();
