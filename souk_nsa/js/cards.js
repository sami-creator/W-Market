/* cards.js — بطاقة الإعلان (نسبة ثابتة + fallback للصور) + الموقع + "سعر ثابت" + شارات الحالة/الكراء */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k);
  const T = (ar, fr, en) => ({ ar, fr, en }[I18n.lang] || ar);
  const FALLBACK = 'assets/images/placeholder.svg';

  function img(src, alt, cls) {
    const i = el('img', { class: cls, alt: alt || '', loading: 'lazy', decoding: 'async', src: Utils.imgUrl(src, 'thumb') });
    i.addEventListener('error', () => { if (!i.dataset.fb) { i.dataset.fb = '1'; i.src = FALLBACK; } });
    return i;
  }

  // "الولاية · 12 كم" (الولاية تظهر إن كانت بيانات Geo محمّلة)
  function locationText(ad) {
    const w = window.Geo && ad.wilaya_id ? Geo.wilaya(ad.wilaya_id) : null;
    const parts = [];
    if (w) parts.push(w.id + '. ' + Geo.label(w));
    if (ad.distance_km != null) parts.push(t('ad.distance_km').replace('{n}', Math.round(ad.distance_km)));
    return parts.join(' · ');
  }

  const Cards = {
    render(ad) {
      const p = Price.display(ad), sold = ad.status === 'sold', at = ad.attrs || {};
      const card = el('article', { class: 'card', 'data-id': ad.id });
      const badges = el('div', { class: 'card__badges' });
      if (p.pct > 0) badges.append(el('span', { class: 'badge badge--sale', text: '-' + p.pct + '%' }));
      if (ad.negotiable) badges.append(el('span', { class: 'badge badge--nego', text: t('ad.negotiable') }));
      if (at.condition === 'used') badges.append(el('span', { class: 'badge badge--used', text: T('مستعمل', 'Occasion', 'Used') }));
      if (at.listing_type === 'rent') badges.append(el('span', { class: 'badge badge--rent', text: T('كراء', 'Location', 'Rent') }));
      if (at.listing_type === 'both') badges.append(el('span', { class: 'badge badge--rent', text: T('بيع/كراء', 'Vente/Loc.', 'Sale/Rent') }));
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
        el('span', { 'data-likes': ad.id, text: '♥ ' + (ad.likes_count || 0) })
      ]);
      const priceRow = el('div', {}, [el('span', { class: 'card__price', text: p.text }), p.old ? el('span', { class: 'card__old', text: p.oldText }) : null]);
      const loc = locationText(ad);
      const body = el('div', { class: 'card__body' }, [
        el('div', { class: 'card__title', text: ad.title }), priceRow,
        ad.negotiable ? null : el('span', { class: 'card__prix-fixe', text: T('سعر ثابت', 'Prix fixe', 'Fixed price') }),
        user,
        loc ? el('div', { class: 'card__location', text: loc }) : null,
        meta
      ]);
      card.append(top, body);
      card.addEventListener('click', () => {
        if (window.Tracking) Tracking.click(ad);
        // حفظ موضع التمرير لاستعادته عند العودة للرئيسية
        if (window.Router && document.body.dataset.page === 'home') Router.saveState({ scroll: window.scrollY });
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
