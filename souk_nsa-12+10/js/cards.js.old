/* cards.js — بطاقة الإعلان مطابقة للبروتوتايب (بدون المسافة بالكيلومتر، مع الولاية وسعر ثابت) */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k);
  const FALLBACK = 'assets/images/placeholder.svg';
  const ONLINE_MS = 5 * 60 * 1000;
  const HEART = 'M12 21s-6.7-4.35-9.33-8.02C.86 10.6 1.2 7.3 3.6 5.4 5.8 3.66 8.9 4.1 10.6 6.1L12 7.7l1.4-1.6c1.7-2 4.8-2.44 7-.7 2.4 1.9 2.74 5.2 0.93 7.58C18.7 16.65 12 21 12 21z';
  const STAR = 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z';
  const seen = new Map(); // user_id -> last_seen

  function svg(path, size, attrs) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size);
    Object.entries(attrs || {}).forEach(([k, v]) => s.setAttribute(k, v));
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', path); s.append(p);
    return s;
  }

  function img(src, alt, cls) {
    const i = el('img', { class: cls, alt: alt || '', loading: 'lazy', decoding: 'async', src: Utils.imgUrl(src, 'thumb') });
    i.addEventListener('error', () => { if (!i.dataset.fb) { i.dataset.fb = '1'; i.src = FALLBACK; } });
    return i;
  }

  const Cards = {
    render(ad) {
      const p = Price.display(ad), sold = ad.status === 'sold';
      const card = el('article', { class: 'card', 'data-id': ad.id, 'data-uid': ad.user_id });

      const wrap = el('div', { class: 'img-wrap' }, [img(ad.thumb_path, ad.title, '')]);
      if (sold) card.append(el('div', { class: 'badge-sold', text: t('ad.sold') }));
      if (p.pct > 0) card.append(el('div', { class: 'badge-discount', text: '-' + p.pct + '%' }));

      const dot = el('div', { class: 'mini-dot', 'data-presence': ad.user_id });
      const seller = el('div', { class: 'seller-row' }, [
        el('div', { class: 'seller-avatar' }, [img(ad.user_avatar || 'assets/images/avatar.svg', ad.user_name, ''), dot]),
        el('div', { class: 'seller' }, [ad.user_name || '', ad.is_verified ? el('span', { class: 'seller-verified', text: ' ✓' }) : null])
      ]);

      const wil = ad.wilaya_id ? Geo.wilaya(ad.wilaya_id) : null;
      const priceEl = el('div', { class: 'price' }, [p.old ? el('span', { class: 'old-price', text: p.oldText }) : null, p.text]);

      const star = svg(STAR, 14, { fill: '#F5A623' });
      const heartBtn = el('button', { class: 'heart', type: 'button', 'aria-label': t('ad.likes'), 'data-like': ad.id });
      heartBtn.append(svg(HEART, 16), el('span', { 'data-likes': ad.id, 'data-plain': '', text: String(ad.likes_count || 0) }));
      heartBtn.disabled = sold;
      heartBtn.addEventListener('click', e => { e.stopPropagation(); if (window.Likes) Likes.toggle(ad, heartBtn); });

      card.append(wrap,
        el('h3', { text: ad.title }), seller,
        wil ? el('div', { class: 'loc', text: '📍 ' + Geo.label(wil) }) : null,
        el('div', { class: 'nego-tag' + (ad.negotiable ? '' : ' fixed'), text: ad.negotiable ? t('ad.negotiable') : t('ad.fixed_price') }),
        priceEl,
        el('div', { class: 'card-footer' }, [el('div', { class: 'rating' }, [star, Number(ad.rating_avg || 0).toFixed(1)]), heartBtn]),
        el('div', { class: 'date', text: String(ad.created_at || '').slice(0, 10) })
      );
      if (sold) wrap.append(el('div', { class: 'sold-ribbon', text: t('ad.sold') }));
      card.addEventListener('click', () => {
        if (window.Tracking) Tracking.click(ad);
        Utils.go(window.CONFIG.ROUTES.AD, { id: ad.id });
      });
      if (window.Likes && Likes.has(ad.id)) heartBtn.classList.add('liked');
      return card;
    },

    renderList(container, items, { append = false } = {}) {
      if (!append) container.replaceChildren();
      const f = document.createDocumentFragment();
      items.forEach(a => f.append(this.render(a)));
      container.append(f);
      this.presence(container, items);
    },

    // نقطة الاتصال: أخضر إن ظهرت الناشرة خلال 5 دقائق وإلا أحمر (قراءة فقط من seller_public)
    async presence(container, items) {
      const paint = () => container.querySelectorAll('[data-presence]').forEach(d => {
        const ls = seen.get(d.dataset.presence);
        d.classList.toggle('online', !!ls && Date.now() - new Date(ls).getTime() < ONLINE_MS);
      });
      const need = [...new Set((items || []).map(a => a.user_id).filter(id => id && !seen.has(id)))];
      if (need.length) {
        try {
          const { data } = await SB.db.from('seller_public').select('id,last_seen').in('id', need);
          (data || []).forEach(r => seen.set(r.id, r.last_seen));
          need.forEach(id => { if (!seen.has(id)) seen.set(id, null); });
        } catch (e) { console.warn('[Cards] presence', e); }
      }
      paint();
    }
  };
  window.Cards = Cards;
})();
