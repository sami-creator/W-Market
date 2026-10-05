/* reports.js — الإبلاغ عن ناشر/إعلان (مرة واحدة، بلا إجراء تلقائي) */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k);
  const REASONS = {
    user: ['fake_account', 'scammer', 'unsafe'],
    ad: ['bad_image', 'bad_words', 'fake_ad', 'stolen', 'wrong_price']
  };

  const Reports = {
    async open(type, id) {
      await Auth.ready();
      if (!Auth.isLogged()) { UI.toastKey('auth.need_login', 'info'); return Router.toLogin(); }
      const ov = el('div', { class: 'modal-overlay' }), box = el('div', { class: 'modal' });
      const list = el('div', { class: 'check-list' });
      REASONS[type].forEach(r => list.append(el('label', {}, [el('input', { type: 'checkbox', value: r }), t('report.' + r)])));
      const note = el('textarea', { class: 'input', maxlength: window.CONFIG.LIMITS.REPORT_NOTE });
      const send = el('button', { class: 'btn btn--primary grow', type: 'button' }, t('common.send'));
      const cancel = el('button', { class: 'btn btn--ghost', type: 'button', onclick: () => ov.remove() }, t('common.cancel'));
      send.addEventListener('click', async () => {
        const reasons = [...list.querySelectorAll('input:checked')].map(i => i.value);
        if (!reasons.length) return;
        const n = Sanitize.validateText(note.value, { max: window.CONFIG.LIMITS.REPORT_NOTE, allowPhone: true });
        UI.setLoading(send, true);
        const { error } = await SB.db.rpc('submit_report', { p_type: type, p_id: id, p_reasons: reasons, p_note: n.value, p_device: await Fingerprint.get() });
        UI.setLoading(send, false);
        if (error) return UI.toastKey(UI.errKey(error), 'error');
        UI.toastKey('report.done', 'success'); ov.remove();
      });
      box.append(el('h3', { text: t('report.' + type) }), list, note, el('div', { class: 'modal__row' }, [send, cancel]));
      ov.append(box); ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); }); document.body.append(ov);
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
