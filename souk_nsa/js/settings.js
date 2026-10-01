/* settings.js — الإعدادات: اللغة، الوضع الليلي، اللون، الخط، الدعم، الخصوصية، الإبلاغ عن خطأ */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), C = window.CONFIG;
  const COLOR_HEX = { rose: '#c2607a', beige: '#a67c52', gold: '#c9962e', cream: '#8f7a6b' };

  const Settings = {
    render(root) {
      root.replaceChildren();
      const row = (label, ctrl) => el('div', { class: 'settings-row' }, [el('span', { text: label }), ctrl]);

      const lang = el('select', { class: 'input', style: 'width:auto' });
      [['ar', 'العربية'], ['fr', 'Français'], ['en', 'English']].forEach(([v, n]) => lang.append(new Option(n, v)));
      lang.value = I18n.lang; lang.addEventListener('change', async () => { await I18n.set(lang.value); this.render(root); });

      const dark = el('button', { class: 'switch', role: 'switch', type: 'button', 'aria-checked': document.documentElement.dataset.theme === 'dark' });
      dark.addEventListener('click', () => { Theme.toggleMode(); dark.setAttribute('aria-checked', document.documentElement.dataset.theme === 'dark'); });

      const sw = el('div', { class: 'swatches' });
      C.COLORS.forEach(c => {
        const b = el('button', { class: 'swatch' + (document.documentElement.dataset.color === c ? ' active' : ''), type: 'button', style: 'background:' + COLOR_HEX[c], 'aria-label': c });
        b.addEventListener('click', () => { Theme.setColor(c); sw.querySelectorAll('.swatch').forEach(x => x.classList.remove('active')); b.classList.add('active'); });
        sw.append(b);
      });

      const font = el('select', { class: 'input', style: 'width:auto' });
      Object.entries(C.FONTS).forEach(([k, n]) => font.append(new Option(n, k)));
      font.value = document.documentElement.dataset.font || C.DEFAULTS.FONT;
      font.addEventListener('change', () => Theme.setFont(font.value));

      const wa = C.SUPPORT.WHATSAPP ? 'https://wa.me/' + encodeURIComponent(C.SUPPORT.WHATSAPP) : null;
      const tg = C.SUPPORT.TELEGRAM ? 'https://t.me/' + encodeURIComponent(C.SUPPORT.TELEGRAM) : null;
      const support = el('div', { class: 'contact-links' }, [
        wa ? el('a', { href: wa, target: '_blank', rel: 'noopener noreferrer', text: 'WhatsApp' }) : null,
        tg ? el('a', { href: tg, target: '_blank', rel: 'noopener noreferrer', text: 'Telegram' }) : null
      ]);

      root.append(
        row(t('settings.language'), lang), row(t('settings.dark'), dark),
        row(t('settings.color'), sw), row(t('settings.font'), font),
        row(t('settings.support'), support),
        el('div', { class: 'settings-row' }, [el('a', { href: C.ROUTES.PRIVACY, text: t('settings.privacy') })]),
        el('div', { class: 'settings-row' }, [el('button', { class: 'btn btn--ghost', type: 'button', onclick: () => this.reportBug(), text: t('settings.report_bug') })])
      );
      if (Auth.isLogged()) {
        const box = el('div', { class: 'card-box', style: 'margin-top:14px' }, [el('h3', { text: t('notif.alerts') })]);
        const inner = el('div'); box.append(inner); root.append(box); Alerts.render(inner);
      }
    },

    reportBug() {
      const ov = el('div', { class: 'modal-overlay' }), box = el('div', { class: 'modal' });
      const ta = el('textarea', { class: 'input', maxlength: C.LIMITS.INPUT_GENERIC });
      const send = el('button', { class: 'btn btn--primary grow', type: 'button' }, t('common.send'));
      send.addEventListener('click', async () => {
        const v = Sanitize.validateText(ta.value, { max: C.LIMITS.INPUT_GENERIC, min: 3, allowPhone: true });
        if (!v.ok) return UI.toastKey(v.error, 'error');
        UI.setLoading(send, true);
        const { error } = await SB.db.from('error_logs').insert({ user_id: Auth.uid(), page: 'settings', message: '[user_report] ' + v.value, device_model: navigator.userAgent.slice(0, 120) });
        UI.setLoading(send, false);
        if (error) return UI.toastKey('err.generic', 'error');
        UI.toastKey('report.done', 'success'); ov.remove();
      });
      box.append(el('h3', { text: t('settings.report_bug') }), ta, el('div', { class: 'modal__row' }, [send, el('button', { class: 'btn btn--ghost', type: 'button', onclick: () => ov.remove() }, t('common.cancel'))]));
      ov.append(box); ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); }); document.body.append(ov);
    }
  };
  window.Settings = Settings;
})();
