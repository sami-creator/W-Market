/* categories.js — الأصناف والأصناف الفرعية وفلاتر كل صنف + نطاقات الأسعار من قاعدة البيانات */
(function () {
  'use strict';
  let cats = [], ranges = {}, loaded = false;

  const Categories = {
    async load() {
      if (loaded) return cats;
      try { cats = await (await fetch('data/categories.json')).json(); } catch (e) { console.error('[Categories]', e); cats = []; }
      try {
        const { data } = await SB.db.from('categories').select('id,min_price,max_price');
        (data || []).forEach(r => { ranges[r.id] = { min: r.min_price, max: r.max_price }; });
      } catch (e) { console.error('[Categories] ranges', e); }
      loaded = true; return cats;
    },
    all() { return cats; },
    main(id) { return cats.find(c => c.id === id); },
    sub(mainId, subId) { const m = this.main(mainId); return m ? m.sub.find(s => s.id === subId) : null; },
    findSub(subId) { for (const m of cats) { const s = m.sub.find(x => x.id === subId); if (s) return { main: m, sub: s }; } return null; },
    label(o) { return o ? (o[I18n.lang] || o.ar) : ''; },
    path(mainId, subId) {
      const m = this.main(mainId), s = m && m.sub.find(x => x.id === subId);
      return [m, s].filter(Boolean).map(x => this.label(x)).join(' ← ');
    },
    filtersFor(subId) { const f = this.findSub(subId); return f ? f.sub.filters || [] : []; },
    // النطاق: الصنف الفرعي أولًا ثم الرئيسي
    range(mainId, subId) {
      const r = ranges[subId] || ranges[mainId];
      return r && (r.min != null || r.max != null) ? r : null;
    }
  };
  window.Categories = Categories;
})();
