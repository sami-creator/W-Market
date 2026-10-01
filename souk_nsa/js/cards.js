/* cards.js — بطاقة الإعلان (نسبة ثابتة + fallback للصور) */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k);
  const FALLBACK = 'assets/images/placeholder.svg';

  function img(src, alt, cls) {
    const i = el('img', { class: cls, alt: alt || '', loading: 'lazy', decoding: 'async', src: Utils.imgUrl(src, 'thumb') });
    i.addEventListener('error', () => { if (!i.dataset.fb) { i.dataset.fb = '1'; i.src = FALLBACK; } });
    return i;
  }

  const Cards = {
    render(ad) {
      const p = Price.display(ad), sold = ad.status === 'sold';
      const card = el('article', { class: 'card', 'data-id': ad.id });
      const badges = el('div', { class: 'card__badges' });
      if (p.pct > 0) badges.append(el('span', { class: 'badge badge--sale', text: '-' + p.pct + '%' }));
      if (ad.negotiable) badges.append(el('span', { class: 'badge badge--nego', text: t('ad.negotiable') }));
      if (ad.is_edited) badges.append(el('span', { class: 'badge badge--edited', text: t('ad.edited') }));

      const like = el('button', { class: 'like-btn', type: 'button', 'aria-label': t('ad.likes'), 'data-like': ad.id }, '♥');
      like.disabled = sold;
      like.addEventListener('click', e => { e.stopPropagation(); if (window.Likes) Likes.toggle(ad, like); });

      const top = el('div', { style: 'position:relative' }, [img(ad.thumb_path, ad.title, 'card__img'), badges, like]);
      if (sold) top.append(el('div', { class: 'sold-ribbon', text: t('ad.sold') }));

      const user = el('div', { class: 'card__user' }, [
        img(ad.user_avatar || 'assets/images/avatar.svg', '', 'avatar-xs'),
        el('span', { text: ad.user_name || '' }),
        ad.is_verified ? el('span', { class: 'verified-tick', text: '✓' }) : null
      ]);
      const meta = el('div', { class: 'card__meta' }, [
        el('span', { class: 'stars', text: '★ ' + Number(ad.rating_avg || 0).toFixed(1) + ' (' + (ad.rating_count || 0) + ')' }),
        el('span', { text: '♥ ' + (ad.likes_count || 0) })
      ]);
      const priceRow = el('div', {}, [el('span', { class: 'card__price', text: p.text }), p.old ? el('span', { class: 'card__old', text: p.oldText }) : null]);
      const body = el('div', { class: 'card__body' }, [
        el('div', { class: 'card__title', text: ad.title }), priceRow, user, meta,
        ad.distance_km != null ? el('div', { class: 'hint', text: t('ad.distance_km').replace('{n}', Math.round(ad.distance_km)) }) : null
      ]);
      card.append(top, body);
      card.addEventListener('click', () => {
        if (window.Tracking) Tracking.click(ad);
        Utils.go(window.CONFIG.ROUTES.AD, { id: ad.id });
      });
      // أول ظهور: قلب أحمر ممتلئ إن كان معجَبًا به
      if (window.Likes && Likes.has(ad.id)) like.classList.add('liked');
      return card;
    },
    renderList(container, items, { append = false } = {}) {
      if (!append) container.replaceChildren();
      const f = document.createDocumentFragment();
      items.forEach(a => f.append(this.render(a)));
      container.append(f);
    }
  };
  window.Cards = Cards;
})();
