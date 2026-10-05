/* post-ad.js — نشر/تعديل إعلان بـ4 خطوات، مسودة تلقائية، والتحقق يتكرر في Edge Function (submit-ad) */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), L = window.CONFIG.LIMITS, R = window.CONFIG.ROUTES;
  const $ = s => document.querySelector(s);
  const TOTAL = 4;

  App.pages['post-ad'] = async function () {
    const st = await App.boot({ guard: true });
    if (!st) return;
    await Promise.all([Categories.load(), Geo.load()]);
    const root = $('#wizard'), stepper = $('#stepper'), label = $('#step-label');
    const editId = Utils.qs('id');
    const verified = !!st.profile.is_verified;
    const S = { category_id: '', subcategory_id: '', attrs: {}, title: '', description: '', price: '', discount_pct: 0, negotiable: false, delivery: null, show_phone: false, video_url: '', faq: [], lat: null, lng: null, wilaya_id: st.profile.wilaya_id, daira_id: st.profile.daira_id, commune_id: st.profile.commune_id };
    let files = [], step = 1, orig = null, keepImages = false, existing = 0;

    if (editId) {
      orig = await Ads.get(editId);
      if (!orig || orig.user_id !== Auth.uid() || orig.status === 'deleted') return Utils.go(R.MY_ADS);
      Object.assign(S, { category_id: orig.category_id, subcategory_id: orig.subcategory_id, attrs: orig.attrs || {}, title: orig.title, description: orig.description, price: orig.price, discount_pct: orig.discount_pct || 0, negotiable: !!orig.negotiable, delivery: !!orig.delivery, show_phone: !!orig.show_phone, video_url: orig.video_url || '', faq: orig.faq || [], wilaya_id: orig.wilaya_id, daira_id: orig.daira_id, commune_id: orig.commune_id });
      existing = (await Ads.images(orig.id)).length; keepImages = existing > 0;
    } else {
      const d = Utils.Store.get(window.CONFIG.STORAGE_KEYS.DRAFT); if (d) Object.assign(S, d);
    }
    const saveDraft = Utils.debounce(() => { if (!editId) { Utils.Store.set(window.CONFIG.STORAGE_KEYS.DRAFT, S); } }, 800);

    const field = (lbl, node, extra) => el('div', { class: 'field' }, [el('label', { text: lbl }), node, extra || null]);
    const bind = (input, key, fn) => input.addEventListener('input', () => { S[key] = fn ? fn(input.value) : input.value; saveDraft(); });
    const counter = (input, max) => { const c = el('div', { class: 'char-count' }); const u = () => { c.textContent = input.value.length + ' / ' + max; }; input.addEventListener('input', u); u(); return c; };

    /* ---- الخطوة 1 ---- */
    function step1() {
      const c = el('select', { class: 'input' }), s = el('select', { class: 'input' }), attrs = el('div');
      c.append(new Option(t('filters.category'), '')); Categories.all().forEach(m => c.append(new Option(Categories.label(m), m.id))); c.value = S.category_id;
      const fillSub = () => {
        s.replaceChildren(new Option(t('filters.subcategory'), ''));
        const m = Categories.main(c.value); (m ? m.sub : []).forEach(x => s.append(new Option(Categories.label(x), x.id))); s.value = S.subcategory_id; fillAttrs();
      };
      const fillAttrs = () => {
        attrs.replaceChildren();
        Categories.filtersFor(s.value).forEach(f => {
          const i = f.type === 'select' ? el('select', { class: 'input' }) : el('input', { class: 'input', maxlength: f.max || 30 });
          if (f.type === 'select') { i.append(new Option('—', '')); f.options.forEach(o => i.append(new Option(o, o))); }
          i.value = S.attrs[f.key] || '';
          i.addEventListener('input', () => { const v = Sanitize.cleanText(i.value, 30); v ? S.attrs[f.key] = v : delete S.attrs[f.key]; saveDraft(); });
          attrs.append(field(f.key, i));
        });
      };
      c.addEventListener('change', () => { S.category_id = c.value; S.subcategory_id = ''; S.attrs = {}; fillSub(); saveDraft(); });
      s.addEventListener('change', () => { S.subcategory_id = s.value; S.attrs = {}; fillAttrs(); saveDraft(); });
      const ti = el('input', { class: 'input', maxlength: L.TITLE, value: S.title }); bind(ti, 'title');
      const de = el('textarea', { class: 'input', maxlength: L.DESCRIPTION }); de.value = S.description; bind(de, 'description');
      fillSub();
      return [field(t('filters.category'), c), field(t('filters.subcategory'), s), attrs, field(t('ad.title'), ti, counter(ti, L.TITLE)), field(t('ad.description'), de, counter(de, L.DESCRIPTION))];
    }
    function check1() {
      if (!S.category_id || !S.subcategory_id) return 'err.category_required';
      const a = Sanitize.validateText(S.title, { max: L.TITLE, min: 3 }); if (!a.ok) return a.error; S.title = a.value;
      const b = Sanitize.validateText(S.description, { max: L.DESCRIPTION, min: 5 }); if (!b.ok) return b.error; S.description = b.value;
    }

    /* ---- الخطوة 2 ---- */
    function step2() {
      const pr = el('input', { class: 'input', type: 'number', inputmode: 'numeric', min: 1, value: S.price }); bind(pr, 'price');
      const r = Categories.range(S.category_id, S.subcategory_id);
      const hint = el('div', { class: 'hint', text: r ? Utils.formatNumber(r.min ?? 0) + ' - ' + (r.max != null ? Utils.formatNumber(r.max) : '∞') : '' });
      const dc = el('input', { class: 'input', type: 'number', min: 0, max: 90, inputmode: 'numeric', value: S.discount_pct }); bind(dc, 'discount_pct', v => Math.min(90, Math.max(0, parseInt(v, 10) || 0)));
      const ng = el('input', { type: 'checkbox' }); ng.checked = S.negotiable; ng.addEventListener('change', () => { S.negotiable = ng.checked; saveDraft(); });
      const mk = (val, key) => { const i = el('input', { type: 'radio', name: 'dl' }); i.checked = S.delivery === val; i.addEventListener('change', () => { S.delivery = val; saveDraft(); }); return el('label', { class: 'row' }, [i, t(key)]); };
      const sp = el('input', { type: 'checkbox' }); sp.checked = S.show_phone;
      sp.addEventListener('change', () => { S.show_phone = sp.checked; saveDraft(); });
      return [field(t('ad.price'), pr, hint), field(t('ad.discount'), dc), el('label', { class: 'row' }, [ng, t('ad.negotiable')]),
        el('div', { class: 'field' }, [el('label', { text: t('ad.delivery') }), mk(true, 'ad.delivery_yes'), mk(false, 'ad.delivery_no')]),
        el('label', { class: 'row' }, [sp, t('ad.show_phone')])];
    }
    async function check2() {
      const v = Price.validate(S.price, S.category_id, S.subcategory_id);
      if (!v.ok) return v.vars ? t(v.error).replace('{min}', v.vars.min).replace('{max}', v.vars.max) : v.error;
      S.price = v.value;
      if (S.delivery === null) return 'err.delivery_required';
      if (orig && Number(S.price) !== Number(orig.price)) {
        const left = Price.editsLeft(orig);
        if (left <= 0) return 'err.price_edits_max';
        if (left === 1 && !(await UI.confirmDialog(t('ad.price_edit_last')))) return 'common.cancel';
      }
    }

    /* ---- الخطوة 3 ---- */
    function step3() {
      const prev = el('div', { class: 'img-preview' });
      const paint = () => {
        prev.replaceChildren();
        files.forEach((f, i) => prev.append(el('div', { class: 'ph' }, [el('img', { src: URL.createObjectURL(f), alt: '' }), el('button', { type: 'button', 'aria-label': t('common.delete'), onclick: () => { files.splice(i, 1); paint(); } }, '×')])));
        if (!files.length && keepImages) prev.append(el('p', { class: 'hint', text: existing + ' ✓' }));
      };
      const fi = el('input', { class: 'input', type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true });
      fi.addEventListener('change', async () => {
        for (const f of [...fi.files]) {
          if (files.length >= L.IMAGES_MAX) { UI.toastKey('err.image_count', 'error'); break; }
          const v = await Upload.validate(f); if (!v.ok) { UI.toastKey(v.error, 'error'); continue; }
          files.push(f); keepImages = false;
        }
        fi.value = ''; paint();
      });
      const vd = el('input', { class: 'input', type: 'url', inputmode: 'url', maxlength: 300, value: S.video_url }); bind(vd, 'video_url');
      const faqBox = el('div');
      const paintFaq = () => {
        faqBox.replaceChildren();
        S.faq.forEach((q, i) => {
          const qi = el('input', { class: 'input', maxlength: L.FAQ_Q, placeholder: t('ad.faq_q'), value: q.q }), ai = el('input', { class: 'input', maxlength: L.FAQ_A, placeholder: t('ad.faq_a'), value: q.a });
          qi.addEventListener('input', () => { q.q = qi.value; saveDraft(); }); ai.addEventListener('input', () => { q.a = ai.value; saveDraft(); });
          faqBox.append(el('div', { class: 'card-box' }, [qi, ai, el('button', { class: 'btn btn--ghost', type: 'button', onclick: () => { S.faq.splice(i, 1); paintFaq(); } }, t('common.delete'))]));
        });
        if (S.faq.length < L.FAQ_MAX) faqBox.append(el('button', { class: 'btn btn--ghost', type: 'button', onclick: () => { S.faq.push({ q: '', a: '' }); paintFaq(); } }, t('ad.faq_add')));
      };
      paint(); paintFaq();
      return [field(t('ad.images'), fi, el('div', { class: 'hint', text: t('ad.cover_hint') })), prev, field(t('ad.video'), vd), el('h3', { text: t('ad.faq') }), faqBox];
    }
    function check3() {
      const n = files.length || (keepImages ? existing : 0);
      if (n < L.IMAGES_MIN || n > L.IMAGES_MAX) return 'err.image_count';
      const v = Sanitize.validateUrl(S.video_url, 'video'); if (!v.ok) return v.error; S.video_url = v.value;
      const faq = [];
      for (const q of S.faq) {
        if (!q.q && !q.a) continue;
        const a = Sanitize.validateText(q.q, { max: L.FAQ_Q, min: 2 }), b = Sanitize.validateText(q.a, { max: L.FAQ_A, min: 1 });
        if (!a.ok) return a.error; if (!b.ok) return b.error; faq.push({ q: a.value, a: b.value });
      }
      S.faq = faq.slice(0, L.FAQ_MAX);
    }

    /* ---- الخطوة 4 ---- */
    let sw, sd, sc;
    function step4() {
      sw = el('select', { class: 'input' }); sd = el('select', { class: 'input' }); sc = el('select', { class: 'input' });
      Geo.bindCascade(sw, sd, sc, { wilaya_id: S.wilaya_id, daira_id: S.daira_id, commune_id: S.commune_id });
      const gps = el('button', { class: 'btn btn--ghost', type: 'button' }, S.lat ? t('ad.gps_done') : t('ad.use_gps'));
      gps.addEventListener('click', () => navigator.geolocation && navigator.geolocation.getCurrentPosition(p => { S.lat = p.coords.latitude; S.lng = p.coords.longitude; gps.textContent = t('ad.gps_done'); saveDraft(); }, () => UI.toastKey('geo.locate_denied', 'error'), { timeout: 8000 }));
      return [field(t('geo.wilaya'), sw), field(t('geo.daira'), sd), field(t('geo.commune'), sc), gps];
    }
    function check4() {
      const g = Geo.values(sw, sd, sc); if (!g.wilaya_id || !g.daira_id || !g.commune_id) return 'err.location_required';
      Object.assign(S, g);
    }

    const builders = [null, step1, step2, step3, step4], checks = [null, check1, check2, check3, check4];
    function render() {
      root.replaceChildren(...builders[step]());
      stepper.replaceChildren(...Array.from({ length: TOTAL }, (_, i) => el('span', { class: i < step ? 'on' : '' })));
      label.textContent = t('ad.step').replace('{n}', step).replace('{total}', TOTAL);
      $('#btn-back').hidden = step === 1;
      $('#btn-next').textContent = t(step === TOTAL ? (editId ? 'ad.update' : 'ad.publish') : 'common.next');
      window.scrollTo({ top: 0 });
    }

    $('#btn-back').addEventListener('click', () => { step--; render(); });
    $('#btn-next').addEventListener('click', async () => {
      const btn = $('#btn-next'), err = await checks[step]();
      if (err) return UI.toast(t(err) === err ? err : t(err), 'error');
      if (step < TOTAL) { step++; return render(); }
      UI.setLoading(btn, true);
      try {
        const id = editId || Utils.uuid();
        let images = null;
        if (files.length) { UI.toast(t('ad.uploading'), 'info', 1500); images = await Upload.putAdImages(id, files); }
        const ad = { category_id: S.category_id, subcategory_id: S.subcategory_id, attrs: S.attrs, title: S.title, description: S.description, price: S.price, discount_pct: S.discount_pct, negotiable: S.negotiable, delivery: S.delivery, show_phone: S.show_phone, video_url: S.video_url, faq: S.faq, wilaya_id: S.wilaya_id, daira_id: S.daira_id, commune_id: S.commune_id, lat: S.lat, lng: S.lng };
        const { data, error } = await SB.fn('submit-ad', { mode: editId ? 'update' : 'create', id, ad, images });
        if (error || (data && data.error)) throw error || new Error(data.error);
        Utils.Store.remove(window.CONFIG.STORAGE_KEYS.DRAFT);
        UI.toastKey(editId ? 'ad.updated' : 'ad.published', 'success');
        setTimeout(() => Utils.go(R.AD, { id }), 700);
      } catch (e) { console.error('[PostAd]', e?.message, e?.context, JSON.stringify(e)); UI.toastKey(UI.errKey(e), 'error'); }
      finally { UI.setLoading(btn, false); }
    });
    render();
    if (!editId && S.title) UI.toastKey('ad.saved_draft', 'info', 1800);
  };
})();
