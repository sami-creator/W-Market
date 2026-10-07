/* search.js — خانة البحث: placeholder ذكي، اقتراحات، "هل تقصد"، بحث AI */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k);
  const SK_Q = window.CONFIG.STORAGE_KEYS.SEARCH_QUERY;
  let box, input, sugBox, dymBox, onSearch = () => {};

  const Search = {
    mount({ input: i, suggest, didYouMean, button, onSubmit }) {
      input = i; sugBox = suggest; dymBox = didYouMean; onSearch = onSubmit;
      input.maxLength = 100;
      const setPh = () => { input.placeholder = t('search.placeholder_example'); };
      setPh(); document.addEventListener('langchange', setPh);

      // استعادة نص البحث المحفوظ
      const savedQ = sessionStorage.getItem(SK_Q) || '';
      if (savedQ) { input.value = savedQ; }

      input.addEventListener('input', Utils.debounce(() => this.suggest(), window.CONFIG.LIMITS.SEARCH_DEBOUNCE_MS));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.submit(); } });
      if (button) button.addEventListener('click', () => this.submit());
      document.addEventListener('click', e => { if (!sugBox.contains(e.target) && e.target !== input) sugBox.hidden = true; });
    },

    async submit() {
      sugBox.hidden = true;
      let q = Sanitize.cleanText(input.value, 100) || input.placeholder;
      // حفظ نص البحث
      try { sessionStorage.setItem(SK_Q, input.value); } catch (e) {}
      if (Sanitize.containsBadWords(q)) { UI.toastKey('err.bad_words', 'error'); return; }
      const filters = await this.interpret(q);
      onSearch(filters);
      this.didYouMean(q);
    },

    async interpret(q) {
      const base = { q };
      try {
        const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 3500);
        const { data, error } = await SB.fn('smart-search', { q });
        clearTimeout(to);
        if (error || !data || !data.filters) throw error || new Error('no filters');
        const f = data.filters;
        return Object.assign(base, {
          category_id: f.category || '', subcategory_id: f.subcategory || '',
          min_price: f.min_price || null, max_price: f.max_price || null,
          wilaya_ids: f.wilaya ? [Number(f.wilaya)].filter(Boolean) : [],
          q: (f.category || f.subcategory) ? '' : (f.keywords ? Sanitize.cleanText(f.keywords, 100) : q)
        });
      } catch (e) {
        console.warn('[Search] AI fallback', e);
        UI.toast(t('search.ai_failed'), 'info', 1000);
        return base;
      }
    },

    async suggest() {
      const q = Sanitize.cleanText(input.value, 100);
      sugBox.replaceChildren();
      if (q.length < 2) { sugBox.hidden = true; return; }
      const { data } = await SB.db.rpc('suggest_terms', { p_q: q });
      const list = (data || []).slice(0, 6);
      if (!list.length) { sugBox.hidden = true; return; }
      list.forEach(r => sugBox.append(el('button', { type: 'button', onclick: () => { input.value = r.term; this.submit(); } }, r.term)));
      sugBox.hidden = false;
    },

    async didYouMean(q) {
      dymBox.replaceChildren();
      const { data } = await SB.db.rpc('did_you_mean', { p_q: q });
      const s = data && data[0] && data[0].term;
      if (!s || s === q) return;
      dymBox.append(t('search.did_you_mean') + ' ', el('button', { type: 'button', onclick: () => { input.value = s; this.submit(); } }, s));
    },

    // مسح البحث المحفوظ
    clearSaved() {
      try { sessionStorage.removeItem(SK_Q); } catch (e) {}
    }
  };
  window.Search = Search;
})();
