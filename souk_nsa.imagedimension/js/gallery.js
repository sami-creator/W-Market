/* gallery.js — معرض الصور مع تحميل مسبق للصورة التالية (لا انتظار عند التمرير) */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k);
  const cache = new Set();
  function preload(src) { if (!src || cache.has(src)) return; cache.add(src); const i = new Image(); i.decoding = 'async'; i.src = src; }

  const Gallery = {
    mount(container, images) {
      container.replaceChildren();
      const list = images.length ? images : [{ path_medium: null, path_large: null, path_thumb: null }];
      let i = 0;
      const main = el('img', { class: 'gallery__main', alt: '' });
      main.addEventListener('error', () => { main.src = 'assets/images/placeholder.svg'; });
      const count = el('span', { class: 'gallery__count' });
      const thumbs = el('div', { class: 'gallery__thumbs' });
      const src = (n, k) => Utils.imgUrl(list[n][k] || list[n].path_medium, k === 'path_large' ? 'large' : 'medium');

      list.forEach((im, n) => {
        const th = el('img', { alt: '', loading: 'lazy', src: Utils.imgUrl(im.path_thumb, 'thumb') });
        th.addEventListener('click', () => show(n)); thumbs.append(th);
      });
      const show = n => {
        i = (n + list.length) % list.length;
        main.src = src(i, 'path_medium');
        count.textContent = (i + 1) + ' / ' + list.length;
        thumbs.querySelectorAll('img').forEach((x, k) => x.classList.toggle('active', k === i));
        // تحميل الصورة التالية فورًا في الخلفية
        preload(src((i + 1) % list.length, 'path_medium'));
        if (list.length > 2) preload(src((i + 2) % list.length, 'path_medium'));
      };
      const nav = (cls, txt, d) => el('button', { class: 'gallery__nav ' + cls, type: 'button', 'aria-label': txt, onclick: () => show(i + d) }, d > 0 ? '›' : '‹');
      const wrap = el('div', { class: 'gallery' }, [main, count]);
      if (list.length > 1) wrap.append(nav('gallery__nav--prev', t('common.back'), -1), nav('gallery__nav--next', t('common.next'), 1));

      // سحب باللمس
      let x0 = null;
      wrap.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
      wrap.addEventListener('touchend', e => {
        if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) show(i + ((dx < 0) === (document.dir !== 'rtl' && document.documentElement.dir !== 'rtl') ? 1 : -1));
      }, { passive: true });
      // التكبير عند الطلب فقط (النسخة الكبيرة) — مع تصفح يمين/يسار بين الصور
      const isRtl = () => document.dir === 'rtl' || document.documentElement.dir === 'rtl';
      main.addEventListener('click', () => {
        let k = i, tx = null, moved = false;
        const big = el('img', { alt: '', style: 'max-width:100%;max-height:90vh;border-radius:12px;object-fit:contain;user-select:none;-webkit-user-drag:none;touch-action:pan-y' });
        const cnt = el('span', { style: 'position:absolute;top:14px;left:14px;background:rgba(0,0,0,.6);color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;direction:ltr' });
        const closeBtn = el('button', { type: 'button', 'aria-label': 'close', style: 'position:absolute;top:10px;right:12px;width:38px;height:38px;border:0;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:22px;line-height:1', text: '×' });
        const ov = el('div', { class: 'modal-overlay', style: 'background:rgba(0,0,0,.92);touch-action:pan-y' }, [big, cnt, closeBtn]);

        const paint = () => {
          big.src = src(k, 'path_large');
          cnt.textContent = (k + 1) + ' / ' + list.length;
          preload(src((k + 1) % list.length, 'path_large'));
          preload(src((k - 1 + list.length) % list.length, 'path_large'));
        };
        const go = d => { if (list.length < 2) return; k = (k + d + list.length) % list.length; paint(); };
        const close = () => { document.removeEventListener('keydown', onKey); ov.remove(); show(k); };
        const onKey = e => {
          if (e.key === 'Escape') close();
          else if (e.key === 'ArrowRight') go(isRtl() ? -1 : 1);
          else if (e.key === 'ArrowLeft') go(isRtl() ? 1 : -1);
        };

        // سحب باللمس: نفس اتجاه معرض الصفحة
        ov.addEventListener('touchstart', e => { tx = e.touches[0].clientX; moved = false; }, { passive: true });
        ov.addEventListener('touchend', e => {
          if (tx === null) return;
          const dx = e.changedTouches[0].clientX - tx; tx = null;
          if (Math.abs(dx) > 40) { moved = true; go((dx < 0) === !isRtl() ? 1 : -1); }
        }, { passive: true });
        // النقر على الخلفية يغلق (إلا بعد سحب)
        ov.addEventListener('click', e => { if (moved) { moved = false; return; } if (e.target !== big) close(); });
        closeBtn.addEventListener('click', e => { e.stopPropagation(); close(); });

        if (list.length > 1) {
          const arrow = (side, txt, d) => el('button', { type: 'button', 'aria-label': txt, style: 'position:absolute;top:50%;transform:translateY(-50%);' + side + ':10px;width:42px;height:42px;border:0;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:24px;line-height:1', onclick: e => { e.stopPropagation(); go(d); } }, d > 0 ? '›' : '‹');
          // الأسهم تتبع اتجاه الشاشة المرئي (يمين = التالي في LTR، والعكس في RTL)
          ov.append(arrow('left', t('common.back'), isRtl() ? 1 : -1), arrow('right', t('common.next'), isRtl() ? -1 : 1));
        }
        document.addEventListener('keydown', onKey);
        document.body.append(ov);
        paint();
      });
      container.append(wrap); if (list.length > 1) container.append(thumbs);
      show(0);
    }
  };
  window.Gallery = Gallery;
})();
