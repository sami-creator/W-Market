/* reports.js — الإبلاغ عن ناشر/إعلان (مرة واحدة، بلا إجراء تلقائي)
   الإعلان: سبب رئيسي ← تفصيل (أو نص حر عند "أخرى")، من CONFIG.REPORT_REASONS. الناشر: الأسباب الأصلية. */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k);
  const T = (ar, fr, en) => ({ ar, fr, en }[I18n.lang] || ar);
  const USER_REASONS = ['fake_account', 'scammer', 'unsafe'];
  const NOTE_MAX = () => window.CONFIG.LIMITS.REPORT_NOTE;
  const pick = o => (o && (o[I18n.lang] || o.ar)) || '';

  function shell(title) {
    const ov = el('div', { class: 'modal-overlay' }), box = el('div', { class: 'modal' });
    ov.append(box); ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    box.append(el('h3', { text: title }));
    document.body.append(ov);
    return { ov, box };
  }

  async function submit(btn, ov, type, id, reasons, note) {
    const n = Sanitize.validateText(note || '', { max: NOTE_MAX(), allowPhone: true });
    if (!n.ok) return UI.toastKey(n.error, 'error');
    UI.setLoading(btn, true);
    const { error } = await SB.db.rpc('submit_report', { p_type: type, p_id: id, p_reasons: reasons, p_note: n.value, p_device: await Fingerprint.get() });
    UI.setLoading(btn, false);
    if (error) return UI.toastKey(UI.errKey(error), 'error');
    UI.toastKey('report.done', 'success'); ov.remove();
  }

  const Reports = {
    async open(type, id) {
      await Auth.ready();
      if (!Auth.isLogged()) { UI.toastKey('auth.need_login', 'info'); return Router.toLogin(); }
      return type === 'ad' ? this.openAd(id) : this.openUser(id);
    },

    // الناشر: أسباب بسيطة متعددة الاختيار
    openUser(id) {
      const { ov, box } = shell(t('report.user'));
      const list = el('div', { class: 'check-list' });
      USER_REASONS.forEach(r => list.append(el('label', {}, [el('input', { type: 'checkbox', value: r }), t('report.' + r)])));
      const note = el('textarea', { class: 'input', maxlength: NOTE_MAX() });
      const send = el('button', { class: 'btn btn--primary grow', type: 'button' }, t('common.send'));
      send.addEventListener('click', () => {
        const reasons = [...list.querySelectorAll('input:checked')].map(i => i.value);
        if (!reasons.length) return;
        submit(send, ov, 'user', id, reasons, note.value);
      });
      box.append(list, note, el('div', { class: 'modal__row' }, [send, el('button', { class: 'btn btn--ghost', type: 'button', onclick: () => ov.remove() }, t('common.cancel'))]));
    },

    // الإعلان: سبب رئيسي ← تفصيل ← إرسال
    openAd(id) {
      const { ov, box } = shell(T('إبلاغ عن الإعلان', "Signaler l'annonce", 'Report ad'));
      const reasons = window.CONFIG.REPORT_REASONS;
      let sel = null, subIdx = -1;
      const send = el('button', { class: 'btn btn--danger grow', type: 'button', disabled: true }, t('common.send'));
      const subBox = el('div', { hidden: true }), otherBox = el('div', { hidden: true });
      const other = el('textarea', { class: 'input', rows: 3, maxlength: NOTE_MAX(), placeholder: T('اكتب السبب...', 'Décrivez...', 'Describe...') });
      otherBox.append(other);
      other.addEventListener('input', () => { send.disabled = !other.value.trim(); });

      const mark = (nodes, node) => { nodes.forEach(n => { n.style.background = ''; }); node.style.background = 'var(--c-soft)'; };
      const rBtns = reasons.map(r => {
        const b = el('button', { class: 'btn btn--ghost btn--block', style: 'margin-bottom:6px;justify-content:flex-start', type: 'button', text: pick(r.label) });
        b.addEventListener('click', () => {
          sel = r; subIdx = -1; mark(rBtns, b);
          subBox.hidden = true; otherBox.hidden = true; send.disabled = true; subBox.replaceChildren();
          if (!r.sub) { otherBox.hidden = false; send.disabled = !other.value.trim(); return; }
          const subs = r.sub[I18n.lang] || r.sub.ar || [];
          const sBtns = subs.map((s, i) => {
            const sb = el('button', { class: 'btn btn--ghost', style: 'margin:3px;font-size:13px', type: 'button', text: s });
            sb.addEventListener('click', () => { subIdx = i; mark(sBtns, sb); send.disabled = false; });
            return sb;
          });
          subBox.append(el('p', { class: 'hint', text: T('تفصيل أكثر:', 'Précisez :', 'Specify:') }), ...sBtns);
          subBox.hidden = false;
        });
        return b;
      });

      send.addEventListener('click', () => {
        if (!sel) return;
        const out = [sel.id];
        let note = '';
        if (sel.sub && subIdx >= 0) { out.push(sel.id + ':' + subIdx); note = (sel.sub[I18n.lang] || sel.sub.ar)[subIdx]; }
        if (!sel.sub) note = other.value;
        submit(send, ov, 'ad', id, out, note);
      });
      box.append(...rBtns, subBox, otherBox, el('div', { class: 'modal__row' }, [send, el('button', { class: 'btn btn--ghost', type: 'button', onclick: () => ov.remove() }, t('common.cancel'))]));
    },

    // زر إبلاغ بقائمتين: الناشر والإعلان
    openMenu(adId, sellerId) {
      const ov = el('div', { class: 'modal-overlay' }), box = el('div', { class: 'modal' });
      const b = (k, fn) => el('button', { class: 'btn btn--ghost btn--block', style: 'margin-bottom:8px', type: 'button', onclick: () => { ov.remove(); fn(); } }, t(k));
      box.append(b('report.user', () => this.open('user', sellerId)), b('report.ad', () => this.open('ad', adId)));
      ov.append(box); ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); }); document.body.append(ov);
    }
  };
  window.Reports = Reports;
})();
