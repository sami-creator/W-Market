/* settings.js — الإعدادات: اللغة، الوضع الليلي، اللون (15)، الخط، الدعم، الخصوصية، الإبلاغ عن خطأ */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), C = window.CONFIG;

  const Settings = {
    render(root) {
      root.replaceChildren();
      const row = (label, ctrl) => el('div', { class: 'settings-row' }, [el('span', { text: label }), ctrl]);
      const block = (label, ctrl) => el('div', { class: 'settings-row', style: 'flex-direction:column;align-items:stretch' }, [el('span', { text: label }), ctrl]);

      const lang = el('select', { class: 'input', style: 'width:auto' });
      [['ar', 'العربية'], ['fr', 'Français'], ['en', 'English']].forEach(([v, n]) => lang.append(new Option(n, v)));
      lang.value = I18n.lang; lang.addEventListener('change', async () => { await I18n.set(lang.value); this.render(root); });

      const dark = el('button', { class: 'switch', role: 'switch', type: 'button', 'aria-checked': document.documentElement.dataset.theme === 'dark' });
      dark.addEventListener('click', () => { Theme.toggleMode(); dark.setAttribute('aria-checked', document.documentElement.dataset.theme === 'dark'); });

      // شبكة الألوان (15 لونًا)
      const grid = el('div', { class: 'color-grid' });
      C.COLORS.forEach(c => {
        const b = el('button', {
          class: 'color-chip' + (document.documentElement.dataset.color === c ? ' sel' : ''), type: 'button',
          style: 'background:' + C.COLOR_HEX[c], title: C.COLOR_LABELS[c] || c, 'aria-label': C.COLOR_LABELS[c] || c
        });
        b.addEventListener('click', () => { Theme.setColor(c); grid.querySelectorAll('.color-chip').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); });
        grid.append(b);
      });

      // قائمة الخطوط (كل خط يُعرض بشكله)
      const fonts = el('div');
      const cur = () => document.documentElement.dataset.font || C.DEFAULTS.FONT;
      Object.entries(C.FONTS).forEach(([k, n]) => {
        const mark = el('span', { text: cur() === k ? '✓' : '' });
        const b = el('button', { class: 'font-option' + (cur() === k ? ' sel' : ''), type: 'button', style: 'font-family:' + C.FONT_STACKS[k] + ';width:100%' }, [el('span', { text: n }), mark]);
        b.addEventListener('click', () => {
          Theme.setFont(k);
          fonts.querySelectorAll('.font-option').forEach(x => { x.classList.remove('sel'); x.lastChild.textContent = ''; });
          b.classList.add('sel'); mark.textContent = '✓';
        });
        fonts.append(b);
      });

      const wa = C.SUPPORT.WHATSAPP ? 'https://wa.me/' + encodeURIComponent(C.SUPPORT.WHATSAPP) : null;
      const tg = C.SUPPORT.TELEGRAM ? 'https://t.me/' + encodeURIComponent(C.SUPPORT.TELEGRAM) : null;
      const support = el('div', { class: 'contact-links' }, [
        wa ? el('a', { href: wa, target: '_blank', rel: 'noopener noreferrer', text: 'WhatsApp' }) : null,
        tg ? el('a', { href: tg, target: '_blank', rel: 'noopener noreferrer', text: 'Telegram' }) : null
      ]);

      root.append(
        row(t('settings.language'), lang), row(t('settings.dark'), dark),
        block(t('settings.color'), grid), block(t('settings.font'), fonts),
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
